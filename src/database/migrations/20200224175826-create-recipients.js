module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('recipients', {
      id: {
        type: Sequelize.INTEGER,
        allNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allNull: false,
      },
      street: {
        type: Sequelize.STRING,
        allNull: false,
      },
      number: {
        type: Sequelize.INTEGER,
        allNull: true,
      },
      complement: {
        type: Sequelize.STRING,
        allNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allNull: true,
      },
      zip_code: {
        type: Sequelize.STRING,
        allNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allNull: false,
      },
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable('recipients');
  },
};
