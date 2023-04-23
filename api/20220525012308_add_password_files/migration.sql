prisma.migrate({
  up: [
    {
      name: 'create_files_table',
      sql: `
        CREATE TABLE files (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          path VARCHAR(255)
        );
      `,
    },
    {
      name: 'add_password_field_to_files_table',
      sql: `
        ALTER TABLE files ADD COLUMN password VARCHAR;
      `,
    },
  ],
  down: [
    {
      name: 'drop_password_field_from_files_table',
      sql: `
        ALTER TABLE files DROP COLUMN password;
      `,
    },
    {
      name: 'drop_files_table',
      sql: `
        DROP TABLE files;
      `,
    },
  ],
})
