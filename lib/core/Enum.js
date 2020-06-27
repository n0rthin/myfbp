module.exports = function (constants) {
  const enumTable = {};

  constants.forEach(constant => {
    enumTable[constant] = constant;
  });

  return Object.freeze(enumTable);
};
