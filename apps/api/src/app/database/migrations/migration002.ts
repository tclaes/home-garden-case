import { Kysely } from 'kysely';
import { Database } from '../types';

async function up(db: Kysely<Database>) {
  // Nullable: users created through the pre-existing plain /users CRUD endpoint (no password
  // field, out of scope for this change) have no credentials and simply can't log in.
  await db.schema.alterTable('user').addColumn('passwordHash', 'text').execute();

  await db.schema
    .alterTable('garden')
    .addColumn('userId', 'integer', (col) =>
      col.references('user.userId').onDelete('cascade').notNull(),
    )
    .execute();

  await db.schema.createIndex('garden_user_id_index').on('garden').column('userId').execute();
}

async function down(db: Kysely<Database>) {
  await db.schema.dropIndex('garden_user_id_index').execute();
  await db.schema.alterTable('garden').dropColumn('userId').execute();
  await db.schema.alterTable('user').dropColumn('passwordHash').execute();
}

export const migration002 = {
  up,
  down,
};
