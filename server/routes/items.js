const express = require("express");
const User = require("../models/User");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const Notification = require("../models/Notification");
const { auth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Helper to look for matches and send notifications
const checkForMatches = async (newItem, type) => {
  try {
    const isLost = type === "lost";
    const TargetModel = isLost ? FoundItem : LostItem;
    
    // Find potential matches of opposite type with same category & subcategory
    const potentialMatches = await TargetModel.find({
      category: newItem.category,
      subcategory: newItem.subcategory,
      status: "active",
      isDeleted: { $ne: true }
    });

    const titleLower = newItem.title.toLowerCase();
    const keywords = titleLower.split(/\s+/).filter(w => w.length > 2);
    
    for (const match of potentialMatches) {
      const matchTitle = match.title.toLowerCase();
      // Check if they share any keyword (length > 2) in the title
      const sharesKeyword = keywords.some(kw => matchTitle.includes(kw)) || 
                           matchTitle.split(/\s+/).filter(w => w.length > 2).some(kw => titleLower.includes(kw));
                           
      if (sharesKeyword) {
        const targetUserId = isLost ? match.finderId : match.ownerId;
        const currentUserId = isLost ? newItem.ownerId : newItem.finderId;

        // Notify matching owner/finder
        await Notification.create({
          userId: targetUserId,
          message: `Potential match found: Another user reported "${newItem.title}" which matches your reported "${match.title}".`,
          type: "match_found",
          relatedItemId: newItem._id,
          itemType: isLost ? "LostItem" : "FoundItem"
        });

        // Notify current user
        await Notification.create({
          userId: currentUserId,
          message: `Potential match detected in database: "${match.title}" matches your reported "${newItem.title}".`,
          type: "match_found",
          relatedItemId: match._id,
          itemType: isLost ? "FoundItem" : "LostItem"
        });
      }
    }
  } catch (err) {
    console.error("Error matching items/creating notifications:", err);
  }
};

// Helper to check if item is owned by user or user is admin
const canModify = (userId, ownerId, userRole) => {
  return userId.toString() === ownerId.toString() || userRole === "admin";
};

// Formatter to sanitize properties based on requester permissions
const formatItem = (item, type, reqUser) => {
  const isOwner = reqUser && (
    (type === "lost" && item.ownerId && (item.ownerId._id || item.ownerId).toString() === reqUser.id) ||
    (type === "found" && item.finderId && (item.finderId._id || item.finderId).toString() === reqUser.id)
  );
  const isAdmin = reqUser && reqUser.role === "admin";
  const hasFullAccess = isOwner || isAdmin;

  // Contact info formatting
  let ownerInfo = null;
  const rawOwner = type === "lost" ? item.ownerId : item.finderId;
  if (rawOwner) {
    ownerInfo = {
      _id: rawOwner._id || rawOwner.id,
      name: rawOwner.name,
    };
    if (isAdmin) {
      ownerInfo.email = rawOwner.email;
    }
  }

  const formatted = {
    _id: item._id,
    title: item.title,
    category: item.category,
    subcategory: item.subcategory,
    description: item.visibleDescription,
    visibleDescription: item.visibleDescription,
    location: {
      public: item.location && item.location.public ? item.location.public : ""
    },
    date: type === "lost" ? item.dateLost : item.dateFound,
    owner: ownerInfo,
    status: item.status,
    type,
    createdAt: item.createdAt,
  };

  if (hasFullAccess) {
    formatted.location.private = item.location && item.location.private ? item.location.private : "";
    formatted.verificationData = item.verificationData || {};
    formatted.publicImages = item.publicImages || [];
    formatted.verificationImages = item.verificationImages || [];
    // Frontend backwards compatibility
    formatted.images = item.verificationImages || [];
  } else {
    // Hidden fields
    formatted.verificationData = {};
    if (item.verificationData) {
      const vData = typeof item.verificationData.toObject === 'function'
        ? item.verificationData.toObject()
        : item.verificationData;
      for (const [key, value] of Object.entries(vData)) {
        if (key === "hideVerification" || key === "enableAIVerification") {
          formatted.verificationData[key] = !!value;
        } else if (value !== undefined && value !== null && String(value).trim() !== "") {
          formatted.verificationData[key] = true;
        }
      }
    }
    if (type === "found") {
      formatted.publicImages = item.publicImages || [];
      formatted.verificationImages = [];
      formatted.imagesHidden = item.verificationImages && item.verificationImages.length > 0;
      // Frontend backwards compatibility
      formatted.images = item.publicImages || [];
    } else {
      formatted.publicImages = item.publicImages || [];
      formatted.verificationImages = item.verificationImages || [];
      // Frontend backwards compatibility
      formatted.images = item.verificationImages || [];
    }
  }

  return formatted;
};

// @route   GET api/items/my-lost
// @desc    Get logged in user's reported lost items
// @access  Private
router.get("/my-lost", auth, async (req, res) => {
  try {
    const items = await LostItem.find({ ownerId: req.user.id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    const formatted = items.map(item => formatItem(item, "lost", req.user));
    res.json(formatted);
  } catch (err) {
    console.error("Get my lost items error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/items/my-found
// @desc    Get logged in user's reported found items
// @access  Private
router.get("/my-found", auth, async (req, res) => {
  try {
    const items = await FoundItem.find({ finderId: req.user.id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    const formatted = items.map(item => formatItem(item, "found", req.user));
    res.json(formatted);
  } catch (err) {
    console.error("Get my found items error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/items/all
// @desc    Get all lost and found items with optional filters
// @access  Public (Optional auth for role check)
router.get("/all", optionalAuth, async (req, res) => {
  try {
    const { category, subcategory, location, status, q } = req.query;
    let filter = {};

    const isAdmin = req.user && (req.user.role === "admin" || req.user.role === "super-admin");
    if (!isAdmin) {
      filter.isDeleted = { $ne: true };
    }

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (status) filter.status = status;
    
    // Fuzzy search for query
    let queryFilter = { ...filter };
    if (q) {
      const regex = new RegExp(q, "i");
      queryFilter.$or = [
        { title: regex },
        { visibleDescription: regex },
      ];
    }

    // Location search on public location field
    if (location) {
      const locRegex = new RegExp(location, "i");
      queryFilter["location.public"] = locRegex;
    }

    let lostFilter = { ...queryFilter };
    let foundFilter = { ...queryFilter };

    if (!isAdmin) {
      const shadowBannedUsers = await User.find({ status: "shadow_banned" }).select("_id");
      const shadowBannedIds = shadowBannedUsers.map(u => u._id);

      lostFilter.ownerId = { $nin: shadowBannedIds };
      foundFilter.finderId = { $nin: shadowBannedIds };
    }

    const lostItems = await LostItem.find(lostFilter).populate("ownerId", "name email");
    const foundItems = await FoundItem.find(foundFilter).populate("finderId", "name email");

    const formattedLost = lostItems.map(item => formatItem(item, "lost", req.user));
    const formattedFound = foundItems.map(item => formatItem(item, "found", req.user));

    const allItems = [...formattedLost, ...formattedFound].sort((a, b) => b.createdAt - a.createdAt);
    res.json(allItems);
  } catch (err) {
    console.error("Get all items error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/items/:id
// @desc    Get a single lost or found item by ID
// @access  Public (Optional auth for role check)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    let item = await LostItem.findById(req.params.id).populate("ownerId", "name email");
    let type = "lost";
    
    if (!item) {
      item = await FoundItem.findById(req.params.id).populate("finderId", "name email");
      type = "found";
    }

    if (!item || (item.isDeleted && (!req.user || req.user.role !== "admin"))) {
      return res.status(404).json({ message: "Item not found" });
    }

    const formatted = formatItem(item, type, req.user);
    res.json(formatted);
  } catch (err) {
    console.error("Get single item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/items/lost
// @desc    Report a lost item
// @access  Private
router.post("/lost", auth, async (req, res) => {
  const { title, category, subcategory, visibleDescription, location, dateLost, publicImages, verificationImages, verificationData } = req.body;

  try {
    const newItem = new LostItem({
      title,
      category,
      subcategory,
      visibleDescription,
      location: location || { public: "", private: "" },
      dateLost,
      publicImages: publicImages ? (Array.isArray(publicImages) ? publicImages : [publicImages]) : [],
      verificationImages: verificationImages ? (Array.isArray(verificationImages) ? verificationImages : [verificationImages]) : [],
      ownerId: req.user.id,
      verificationData: verificationData || {},
    });

    const item = await newItem.save();
    checkForMatches(item, "lost");
    res.status(201).json(item);
  } catch (err) {
    console.error("Create lost item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/items/found
// @desc    Report a found item
// @access  Private
router.post("/found", auth, async (req, res) => {
  const { title, category, subcategory, visibleDescription, location, dateFound, publicImages, verificationImages, verificationData } = req.body;

  try {
    const newItem = new FoundItem({
      title,
      category,
      subcategory,
      visibleDescription,
      location: location || { public: "", private: "" },
      dateFound,
      publicImages: publicImages ? (Array.isArray(publicImages) ? publicImages : [publicImages]) : [],
      verificationImages: verificationImages ? (Array.isArray(verificationImages) ? verificationImages : [verificationImages]) : [],
      finderId: req.user.id,
      verificationData: verificationData || {},
    });

    const item = await newItem.save();
    checkForMatches(item, "found");
    res.status(201).json(item);
  } catch (err) {
    console.error("Create found item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/items/lost/:id
// @desc    Update a lost item
// @access  Private
router.put("/lost/:id", auth, async (req, res) => {
  try {
    let item = await LostItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) {
      return res.status(404).json({ message: "Lost item not found." });
    }

    if (!canModify(req.user.id, item.ownerId, req.user.role)) {
      return res.status(403).json({ message: "User not authorized to edit this item." });
    }

    item = await LostItem.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(item);
  } catch (err) {
    console.error("Update lost item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/items/found/:id
// @desc    Update a found item
// @access  Private
router.put("/found/:id", auth, async (req, res) => {
  try {
    let item = await FoundItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) {
      return res.status(404).json({ message: "Found item not found." });
    }

    if (!canModify(req.user.id, item.finderId, req.user.role)) {
      return res.status(403).json({ message: "User not authorized to edit this item." });
    }

    item = await FoundItem.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(item);
  } catch (err) {
    console.error("Update found item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/items/lost/:id
// @desc    Delete a lost item
// @access  Private
router.delete("/lost/:id", auth, async (req, res) => {
  try {
    const item = await LostItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) {
      return res.status(404).json({ message: "Lost item not found." });
    }

    if (!canModify(req.user.id, item.ownerId, req.user.role)) {
      return res.status(403).json({ message: "User not authorized to delete this item." });
    }

    await LostItem.findByIdAndUpdate(req.params.id, { $set: { isDeleted: true, deletedAt: new Date() } });
    res.json({ message: "Lost item deleted." });
  } catch (err) {
    console.error("Delete lost item error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/items/found/:id
// @desc    Delete a found item
// @access  Private
router.delete("/found/:id", auth, async (req, res) => {
  try {
    const item = await FoundItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!item) {
      return res.status(404).json({ message: "Found item not found." });
    }

    if (!canModify(req.user.id, item.finderId, req.user.role)) {
      return res.status(403).json({ message: "User not authorized to delete this item." });
    }

    await FoundItem.findByIdAndUpdate(req.params.id, { $set: { isDeleted: true, deletedAt: new Date() } });
    res.json({ message: "Found item deleted." });
  } catch (err) {
    console.error("Delete found item error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
