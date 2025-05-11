rm -rf prisma/migrations/
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
apt update && apt install -y postgresql-client
psql $DATABASE_URL -f prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init
node prisma/seed.js