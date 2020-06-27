function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  const constructorNames = ['AsyncGeneratorFunction', 'GeneratorFunction'];
  if (constructorNames.includes(constructor.name) || constructorNames.includes(constructor.displayName)) return true;
  return isGenerator(constructor.prototype);
}

module.exports = {
  isGeneratorFunction
}