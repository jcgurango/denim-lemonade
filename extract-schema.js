const tables = [];

application.tables.forEach((table) => {
  tables.push({
    id: table.id,
    name: table.name,
    columns: table.columns.map((column) => ({
      id: column.id,
      name: column.name,
      type: column.type,
      typeOptions: column.typeOptions,
    })),
  });
});

console.log(JSON.stringify(tables, null, '\t'));
