export interface VerificationField {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export const CATEGORY_MAP: Record<string, string[]> = {
  "Electronics": ["Phone", "Laptop", "Tablet", "Earbuds", "Charger", "Smartwatch", "Camera", "Other"],
  "Wallets & Money": ["Wallet", "Purse", "Cash", "Card Holder", "Other"],
  "Keys": ["House Keys", "Car Keys", "Keychain", "Other"],
  "Bags": ["Backpack", "Handbag", "Laptop Bag", "Suitcase", "Other"],
  "Stationery": ["Pencil Case", "Notebook", "Calculator", "Geometry Box", "Other"],
  "ID & Documents": ["Student ID", "Passport", "Driving License", "PAN Card", "Aadhaar Card", "Certificates", "Other"],
  "Clothing": ["Jacket", "Hoodie", "Cap", "Gloves", "Other"],
  "Jewelry & Accessories": ["Ring", "Necklace", "Bracelet", "Watch", "Other"],
  "Books": ["Textbooks", "Novels", "Notes", "Other"],
  "Water Bottles & Containers": ["Bottle", "Lunch Box", "Tiffin", "Other"],
  "Sports Equipment": ["Cricket Bat", "Football", "Tennis Racket", "Other"],
  "Vehicles": ["Bicycle", "Scooter", "Helmet", "Other"],
  "Medical Items": ["Glasses", "Medicines", "Medical Devices", "Other"],
  "Toys & Games": ["Board Games", "Toys", "Playing Cards", "Other"],
  "Miscellaneous": ["Other"]
};

export const VERIFICATION_FIELDS: Record<string, VerificationField[]> = {
  "Electronics": [
    { name: "brand", label: "Brand", type: "text", placeholder: "e.g. Apple, Samsung, Sony", required: true },
    { name: "model", label: "Model Name / Number", type: "text", placeholder: "e.g. iPhone 15, WH-1000XM4", required: true },
    { name: "color", label: "Color", type: "text", placeholder: "e.g. Space Gray, Silver", required: true },
    { name: "serial", label: "IMEI / Serial Number (Optional)", type: "text", placeholder: "e.g. Serial or IMEI if known" }
  ],
  "Wallets & Money": [
    { name: "color", label: "Wallet Color", type: "text", placeholder: "e.g. Brown, Black", required: true },
    { name: "material", label: "Material", type: "text", placeholder: "e.g. Leather, Fabric, Canvas", required: true },
    { name: "cards", label: "Cards Inside", type: "textarea", placeholder: "e.g. Chase Debit card, Costco membership card", required: true },
    { name: "cash", label: "Approximate Cash Amount", type: "text", placeholder: "e.g. Around $40, Three $10 bills", required: true }
  ],
  "Stationery": [
    { name: "color", label: "Primary Color", type: "text", placeholder: "e.g. Blue, Red", required: true },
    { name: "brand", label: "Brand Name", type: "text", placeholder: "e.g. Classmate, Lamy, Muji", required: true },
    { name: "contents", label: "List of Contents", type: "textarea", placeholder: "e.g. Blue ink pen, 2 pencils, 1 ruler", required: true },
    { name: "specialMarks", label: "Unique Markings (Optional)", type: "text", placeholder: "e.g. Initial sticker 'MG', name written in marker" }
  ],
  "Bags": [
    { name: "color", label: "Bag Color", type: "text", placeholder: "e.g. Navy Blue, Matte Black", required: true },
    { name: "brand", label: "Brand", type: "text", placeholder: "e.g. Jansport, Herschel, Samsonite", required: true },
    { name: "contents", label: "Inside Contents", type: "textarea", placeholder: "e.g. Chemistry textbook, keys, notebook", required: true },
    { name: "size", label: "Approximate Size", type: "select", options: ["Small (e.g. Clutch/Pouch)", "Medium (e.g. Standard Backpack)", "Large (e.g. Duffle/Suitcase)"], required: true }
  ],
  "Keys": [
    { name: "keychain", label: "Keychain / Key Ring Details", type: "text", placeholder: "e.g. Red lanyard, teddy bear charm", required: true },
    { name: "count", label: "Number of Keys on Ring", type: "number", placeholder: "e.g. 3", required: true },
    { name: "specialMarks", label: "Unique Markings", type: "text", placeholder: "e.g. House key has a purple rubber cover", required: true }
  ],
  "ID & Documents": [
    { name: "documentName", label: "Full Name on Document", type: "text", placeholder: "e.g. Johnathan Doe", required: true },
    { name: "documentNumber", label: "ID / Document Number", type: "text", placeholder: "e.g. Student ID Number, license ending in 123", required: true },
    { name: "issuingInstitution", label: "Institution / State (Optional)", type: "text", placeholder: "e.g. State University, California DMV" }
  ],
  "Clothing": [
    { name: "color", label: "Color", type: "text", placeholder: "e.g. Olive Green, Heather Gray", required: true },
    { name: "brand", label: "Brand / Brand Logo", type: "text", placeholder: "e.g. Nike, Patagonia, H&M", required: true },
    { name: "size", label: "Clothing Size", type: "text", placeholder: "e.g. Medium, XL, Unisex", required: true },
    { name: "specialMarks", label: "Unique Markings (Optional)", type: "text", placeholder: "e.g. Ink stain on left cuff, hood drawstring missing" }
  ],
  "Jewelry & Accessories": [
    { name: "type", label: "Metal / Material", type: "text", placeholder: "e.g. Silver, 14k Gold, Beaded", required: true },
    { name: "color", label: "Color", type: "text", placeholder: "e.g. Gold, Rose Gold, Turquoise", required: true },
    { name: "specialMarks", label: "Engravings or Unique Markings", type: "text", placeholder: "e.g. Engraving 'Love Always' inside band", required: true }
  ],
  "Books": [
    { name: "title", label: "Book Title / Subject", type: "text", placeholder: "e.g. Introduction to Physics", required: true },
    { name: "author", label: "Author(s) (Optional)", type: "text", placeholder: "e.g. Halliday & Resnick" },
    { name: "specialMarks", label: "Notes / Name Written Inside", type: "text", placeholder: "e.g. Jane S. written on first page", required: true }
  ],
  "Water Bottles & Containers": [
    { name: "color", label: "Color", type: "text", placeholder: "e.g. Yellow, Metallic silver", required: true },
    { name: "brand", label: "Brand / Material", type: "text", placeholder: "e.g. Hydro Flask (Metal), Nalgene (Plastic)", required: true },
    { name: "specialMarks", label: "Stickers or Custom Marks", type: "text", placeholder: "e.g. Covered in stickers: NASA, Spotify", required: true }
  ],
  "Sports Equipment": [
    { name: "sportType", label: "Equipment Type", type: "text", placeholder: "e.g. Football, Tennis Racket", required: true },
    { name: "brand", label: "Brand", type: "text", placeholder: "e.g. Wilson, Adidas, Spalding", required: true },
    { name: "color", label: "Color / Design", type: "text", placeholder: "e.g. Brown leather, Red and White frame", required: true }
  ],
  "Vehicles": [
    { name: "color", label: "Primary Color", type: "text", placeholder: "e.g. Matte Black, Lime Green", required: true },
    { name: "brand", label: "Brand / Model", type: "text", placeholder: "e.g. Trek, Xiaomi, Bell", required: true },
    { name: "specialMarks", label: "Unique Markings", type: "text", placeholder: "e.g. Scratch on frame near seat, bell is squeaky", required: true }
  ],
  "Medical Items": [
    { name: "type", label: "Item Type", type: "text", placeholder: "e.g. Reading Glasses, Inhaler", required: true },
    { name: "color", label: "Color / Description", type: "text", placeholder: "e.g. Red frame, Blue cover", required: true },
    { name: "brand", label: "Brand / Prescription Details (Optional)", type: "text", placeholder: "e.g. Ray-Ban, Albuterol" }
  ],
  "Toys & Games": [
    { name: "gameName", label: "Game / Toy Name", type: "text", placeholder: "e.g. Catan Board Game, Teddy Bear", required: true },
    { name: "color", label: "Color / Design", type: "text", placeholder: "e.g. Brown, Multicolored box", required: true },
    { name: "specialMarks", label: "Unique Markings (Optional)", type: "text", placeholder: "e.g. Missing 2 resources cards, name tag attached" }
  ],
  "Miscellaneous": [
    { name: "color", label: "Color", type: "text", placeholder: "e.g. Silver, Pink", required: true },
    { name: "brand", label: "Brand / Manufacturer (Optional)", type: "text", placeholder: "e.g. Coleman, Unknown" },
    { name: "specialMarks", label: "Unique Markings", type: "textarea", placeholder: "Describe any special markings that help identify this item", required: true }
  ]
};
