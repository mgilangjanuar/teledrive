prisma.migrate({
  // ...
  steps: [
    {
      name: 'create_files_table',
      up: `
        CREATE TABLE files (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          path VARCHAR(255)
        );
      `,
      down: `
        DROP TABLE files;
      `,
    },
    {
      name: 'add_password_field_to_files_table',
      up: `
        ALTER TABLE files ADD COLUMN password VARCHAR;
      `,
      down: `
        ALTER TABLE files DROP COLUMN password;
      `,
    },
  ],
})
