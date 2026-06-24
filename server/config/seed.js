const mongoose = require("mongoose");
const User = require("../models/User");
const LostItem = require("../models/LostItem");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const ClaimAttempt = require("../models/ClaimAttempt");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

async function seedDB() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already has data. Skipping seed.");
      return;
    }

    console.log("Seeding in-memory MongoDB database...");

    // Create users (passwords will be hashed automatically by the mongoose save middleware)
    const admin = new User({
      name: "Admin User",
      email: "admin@university.edu",
      password: "password123",
      role: "super-admin",
    });
    await admin.save();

    const john = new User({
      name: "John Doe",
      email: "john.doe@university.edu",
      password: "password123",
      role: "user",
    });
    await john.save();

    const jane = new User({
      name: "Jane Smith",
      email: "jane.smith@university.edu",
      password: "password123",
      role: "user",
    });
    await jane.save();

    const alex = new User({
      name: "Alex Jones",
      email: "alex.jones@university.edu",
      password: "password123",
      role: "user",
    });
    await alex.save();

    console.log("Users seeded successfully!");

    // Create lost items
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const johnAirpods = new LostItem({
      title: "AirPods Pro",
      category: "Electronics",
      subcategory: "Headphones",
      visibleDescription: "Left my AirPods Pro in a white charging case at the library second-floor study desks. Case has a small scratch on the front.",
      location: {
        public: "Library (2nd Floor)",
        private: "Under study desk 14 near the windows"
      },
      dateLost: twoDaysAgo,
      ownerId: john._id,
      status: "active",
      verificationData: {
        brand: "Apple",
        model: "AirPods Pro",
        color: "white",
        serial: "12345"
      }
    });
    await johnAirpods.save();

    const alexKeys = new LostItem({
      title: "Dorm Keys on Lanyard",
      category: "Keys",
      subcategory: "Keychain",
      visibleDescription: "Set of 3 keys on a bright red university lanyard. Probably dropped them near the gym lockers or basketball courts.",
      location: {
        public: "Campus Gym / Rec Center",
        private: "Locker area near the water fountain"
      },
      dateLost: threeDaysAgo,
      ownerId: alex._id,
      status: "active",
      verificationData: {
        keychain: "Red university lanyard",
        count: "3 keys",
        specialMarks: "Brass key has blue paint on top"
      }
    });
    await alexKeys.save();

    // Create found items
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const janeFoundAirpods = new FoundItem({
      title: "Apple AirPods Case + Buds",
      category: "Electronics",
      subcategory: "Headphones",
      visibleDescription: "Found AirPods in a white case sitting on a desk on the library second floor. It has a slight scratch on the front. Kept them safe, message me to claim.",
      location: {
        public: "Library",
        private: "Study room B on library 2nd floor"
      },
      dateFound: oneDayAgo,
      finderId: jane._id,
      status: "active",
      verificationData: {
        brand: "Apple",
        model: "AirPods Pro",
        color: "white",
        serial: "12345"
      }
    });
    await janeFoundAirpods.save();

    const johnFoundKeys = new FoundItem({
      title: "Dorm Key with Red Lanyard",
      category: "Keys",
      subcategory: "Keychain",
      visibleDescription: "Found a set of keys attached to a red lanyard in the hallway near the recreation center lockers. Turn them in or message me to retrieve.",
      location: {
        public: "Recreation Center",
        private: "Hallway benches"
      },
      dateFound: twoDaysAgo,
      finderId: john._id,
      status: "active",
      verificationData: {
        keychain: "Red university lanyard",
        count: "3 keys",
        specialMarks: "One is brass, one has blue plastic ring"
      }
    });
    await johnFoundKeys.save();

    console.log("Items seeded successfully!");

    // Create a mock claim: John Doe claims Jane's found AirPods
    const claim = new Claim({
      itemId: janeFoundAirpods._id,
      itemType: "FoundItem",
      claimantId: john._id,
      finderId: jane._id,
      status: "pending",
      claimantVerificationData: {
        brand: "Apple",
        model: "AirPods Pro",
        color: "white",
        serial: "12345",
        locationGuess: "Library 2nd Floor study desks"
      },
      itemSnapshot: {
        title: janeFoundAirpods.title,
        category: janeFoundAirpods.category,
        subcategory: janeFoundAirpods.subcategory,
        location: {
          public: janeFoundAirpods.location.public,
          private: janeFoundAirpods.location.private,
        },
        verificationData: janeFoundAirpods.verificationData,
        createdAt: janeFoundAirpods.createdAt,
      },
      verificationResult: {
        score: 94,
        earnedPoints: 28.2,
        possiblePoints: 30,
        colorScore: 20,
        brandScore: 10,
        contentsScore: 0,
        locationScore: 20,
        semanticScore: 28.2,
        semanticSimilarity: 0.94,
        confidence: "HIGH",
        aiAvailable: true,
        aiModel: "all-MiniLM-L6-v2",
        aiVersion: "1.0",
        matchedTerms: ["airpods", "white", "scratch", "apple"],
        reviewedByHuman: false
      }
    });
    await claim.save();

    // Mark item status as under_review
    janeFoundAirpods.status = "under_review";
    await janeFoundAirpods.save();

    // Create a notification for Jane
    const notification = new Notification({
      userId: jane._id,
      message: `Someone submitted a claim for your reported item: "${janeFoundAirpods.title}". Confidence score: HIGH.`,
      type: "claim_received",
      relatedItemId: janeFoundAirpods._id,
      itemType: "FoundItem",
      relatedClaimId: claim._id
    });
    await notification.save();

    console.log("Mock claim and notifications seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

module.exports = seedDB;
