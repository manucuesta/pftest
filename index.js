/**
 * Checks if the user has access to the route.
 * If the route does not exists the access level is -1 therefore cannot be accessed.
 * 
 * @param {int} access Minimum level of access required for the route
 * @param {int} level User level of access
 * 
 * @returns {Boolean} If the User has access.
 */
const _accessGranted = (access, level) => {
  return access > -1 && level >= access;
}


/**
 * Creates the absolute path composition of a route.
 * If the current path is just a '/' we do not add it to avoid routes like '//route'.
 * 
 * @param {string} path Current path being processed.
 * @param {string} absolutePath Current absolute path composition.
 * 
 * @returns {string} computed absolute path.
 */
const _createRoute = (path, absolutePath) => {
  return path !== '/' ? path + absolutePath : absolutePath;
};


/**
 * Uses the current parent's path to look for the parent's object so we can keep iterating.
 * 
 * We are assuming here that a parent can always be found as they are our only reference,
 * if a parent could not be find, would mean that the registry we are receiving is corrupt,
 * therefore could not be a reliable source to create the paths.
 * 
 * For the same reason we are assuming there are no duplicate objects, because if there were,
 * we could not be sure which one is the parent of the current object, as we only have an string
 * as a reference. To have it working other way around, the reference should not be a path but a unique id
 * or a unique pointer to the parent's route.
 * 
 * @param {Array<Object>} Registry array of routes
 * @param {string} currentParent current parent path
 * 
 * @returns {Object} Parent's registry object {path: string, parent: string, level: int}
 */
const _findParent = (registry, currentParent) => {
  return registry.find(({ path }) => path === currentParent);
};


/**
 * This function creates the absoulte path of a route.
 * 
 * At the same time is calculating every subroute's access level and saving in the route
 * the highest one. This way we know which is the minimun access level needed for a route.
 * Therefore we can use this calculated level later to determine if a user has access to that route.
 * 
 * @param {string} parent Current parent path
 * @param {string} path Current path we are processing
 * @param {int} level Current route's level of access
 * @param {Array<Object>} registry array of routes
 * 
 * @returns {Object} { absolutePath: string, access: number }
 */
const _getPath = (parent, path, level, registry) => {
  // We set the current values as our final values in case the route is a root.
  let 
    absolutePath = path,
    access = level,
    currentParent = parent;

  // If the route is not a root, we check its parent and keep building the absolute path.
  while (currentParent) {
    // As we assumed the parent can always be found, we deconstruct the object it returns
    const { level, parent, path } = _findParent(registry, currentParent);
    
    absolutePath = _createRoute(path, absolutePath); // The absolute path is processed in the _createRoute function, so we just save what it returns.
    access = Math.max(access, level); // Saves the highest access level between the base one and the parent's one, this way we know which is the minimum level needed for the route.
    currentParent = parent; // Our new current parent path is the path property from the parent.
  }

  return { absolutePath: absolutePath, access: access };
};


/**
 * Create a list of all paths and their minimum access level.
 * 
 * @param {Array<Object>} Registry array of routes
 * 
 * @returns {Array<Object>} modified registry
 */
const getAllPaths = (registry) => {
  // For every route, we get its absolute path and return them as an array of objects
  return registry.map(({ parent, path, level }) => {
    // Gets the absolute path of every route in the registry and returns an object with its absolute path and access level.
    return _getPath(parent, path, level, registry);
  });
}


/**
 * Check accessibilty for a user. As we created a new property in the objects called access we do not need to process every subroute again
 * to know if the user has access to it. It is direct.
 * 
 * @param {Object} User { name: string, level: number }
 * @param {String} Path path to check
 * @param {Array<Object>} ModifiedRegistry getAllPaths() result
 * 
 * @returns {Boolean} if the user has access
 */
const hasAccess = (user, path, paths) => {
  const 
    { level } = user, // Via deconstruction we get the level from the user object
    // We deconstruct the access level from the object we calculated before. If the route could not be find, we return a -1 to indicate the route is not accessible.
    { access } = paths.find(({ absolutePath }) => absolutePath === path) || -1; 

  // Returns if the user has access to the route.
  return _accessGranted(access, level);
}


/**
 * Get all paths a user has access too.
 * 
 * @param {Object} User { name: string, level: number }
 * @param {Array<Object>} ModifiedRegistry getAllPaths() result
 * 
 * @returns {Array<Object>} filtered array of routes
 */
const getUserPaths = (user, paths) => {
  // Filters the array we created returning only the routes the received user has access to.
  return paths.filter(({ absolutePath }) => {
    // Uses the hasAccess function previously defined to check if a user has access to the each route.
    return hasAccess(user, absolutePath, paths);
  });
}

module.exports = {
  getAllPaths,
  hasAccess,
  getUserPaths
}
