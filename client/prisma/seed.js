const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.match.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Creating mock users...");
  const john = await prisma.user.create({
    data: {
      email: "john.doe@university.edu",
      name: "John Doe",
      role: "student",
    },
  });

  const jane = await prisma.user.create({
    data: {
      email: "jane.smith@university.edu",
      name: "Jane Smith",
      role: "student",
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: "alex.jones@university.edu",
      name: "Alex Jones",
      role: "student",
    },
  });

  console.log("Creating mock items...");
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // John's lost AirPods
  const johnAirpods = await prisma.item.create({
    data: {
      title: "AirPods Pro",
      description: "Left my AirPods Pro in a white charging case at the library second-floor study desks. Case has a small scratch on the front.",
      type: "LOST",
      category: "Electronics",
      location: "Library (2nd Floor)",
      date: twoDaysAgo,
      status: "ACTIVE",
      tags: "airpods, headphone, white, apple, charging case",
      userId: john.id,
    },
  });

  // Alex's lost Dorm Keys
  const alexKeys = await prisma.item.create({
    data: {
      title: "Dorm Keys on Lanyard",
      description: "Set of 3 keys on a bright red university lanyard. Probably dropped them near the gym lockers or basketball courts.",
      type: "LOST",
      category: "Keys",
      location: "Campus Gym / Rec Center",
      date: threeDaysAgo,
      status: "ACTIVE",
      tags: "keys, lanyard, red, dorm, brass, gym",
      userId: alex.id,
    },
  });

  // Jane's lost Textbook
  const janeBook = await prisma.item.create({
    data: {
      title: "Organic Chemistry Textbook",
      description: "Wade 9th Edition textbook. Has my name 'Jane S.' written on the inside cover. Lost it around the Science Center classrooms.",
      type: "LOST",
      category: "Books",
      location: "Science Center",
      date: oneDayAgo,
      status: "ACTIVE",
      tags: "chemistry, book, science, organic, wade",
      userId: jane.id,
    },
  });

  // Jane's found AirPods
  const janeFoundAirpods = await prisma.item.create({
    data: {
      title: "Apple AirPods Case + Buds",
      description: "Found AirPods in a white case sitting on a desk on the library second floor. It has a slight scratch on the front. Kept them safe, message me to claim.",
      type: "FOUND",
      category: "Electronics",
      location: "Library",
      date: oneDayAgo,
      status: "ACTIVE",
      tags: "airpods, headphones, white, case, apple, scratch",
      userId: jane.id,
    },
  });

  // John's found Dorm Keys
  const johnFoundKeys = await prisma.item.create({
    data: {
      title: "Dorm Key with Red Lanyard",
      description: "Found a set of keys attached to a red lanyard in the hallway near the recreation center lockers. Turn them in or message me to retrieve.",
      type: "FOUND",
      category: "Keys",
      location: "Recreation Center",
      date: twoDaysAgo,
      status: "ACTIVE",
      tags: "keys, lanyard, red, dorm, key",
      userId: john.id,
    },
  });

  console.log("Creating mock matches...");
  // Match 1: John's AirPods and Jane's found AirPods
  await prisma.match.create({
    data: {
      item1Id: johnAirpods.id,
      item2Id: janeFoundAirpods.id,
      score: 94.0,
      reasons: "Category matches (Electronics), High keyword similarity ('AirPods Pro', 'scratch', 'white case'), Location proximity (Library 2nd Floor vs Library)",
      status: "PENDING",
    },
  });

  // Match 2: Alex's Keys and John's found Keys
  await prisma.match.create({
    data: {
      item1Id: alexKeys.id,
      item2Id: johnFoundKeys.id,
      score: 96.0,
      reasons: "Category matches (Keys), Matching tags ('keys', 'lanyard', 'red', 'dorm'), Location overlap (Gym vs Recreation Center)",
      status: "PENDING",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
