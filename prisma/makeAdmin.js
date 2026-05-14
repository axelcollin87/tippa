const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
  // Leta efter användaren (du kan ändra e-posten här om du loggade in med något annat)
  // Men för att vara säkra sätter vi bara ALLA befintliga användare till admin just nu (eftersom det bara är du)
  const result = await prisma.user.updateMany({
    data: {
      isAdmin: true
    }
  });

  console.log(`Uppdaterade ${result.count} användare till administratörer!`);
}

makeAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
