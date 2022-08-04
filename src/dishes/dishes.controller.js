const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//**   Validation Middleware Functions   **//

//PUT and POST validation
 
/**
 * Checks if a property name was given in the request body.
 * Function is to be called on PUT and POST requests
 * If the specified property name exists in the body, as value to res locals.
 * If not, return 400
 */
const bodyHasData = (propertyName) => {
  return (req, res, next) => {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      res.locals[propertyName] = data[propertyName];
      next();
    } else {
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    }
  };
};

/**
 * Checks if the value of name property in request body is not ""
 * Function is to be called on PUT and POST requests
 */
const validateName = (req, res, next) => {
  const { data: { name } = {} } = req.body;
  name.length
    ? next()
    : next({ status: 400, message: `Dish must include a name` });
};
/**
 * Checks if the value of description property in request body is not ""
 * Function is to be called on PUT and POST requests
 */
const validateDescription = (req, res, next) => {
  const { data: { description } = {} } = req.body;
  description.length
    ? next()
    : next({ status: 400, message: `Dish must include a description` });
};
/**
 * Checks if the value of price property in request body is greater than 0 and is an integer
 * Function is to be called on PUT and POST requests
 */
const validatePrice = (req, res, next) => {
  const { data: { price } = {} } = req.body;
  price > 0 && Number.isInteger(price)
    ? next()
    : next({
        status: 400,
        message: `Dish must have a price that is an integer greater than 0`,
      });
};
/**
 * Checks if the value of image_url property in request body is not ""
 * Function is to be called on PUT and POST requests
 */
const validateImageUrl = (req, res, next) => {
  const { data: { image_url } = {} } = req.body;
  image_url.length
    ? next()
    : next({ status: 400, message: `Dish must include a image_url` });
};

/**
 * Checks if the dishId in the route and the Id given in the request body match.  
 * Function is to be called on a PUT request. 
 * Request will not complete if data and route id's do not match. 
 * It is to be noted that there may not be an id given in the data.  However, the request can still be completed if it is not given
 */
const dishIdMatches = (req, res, next) => {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  //if dishId from params and id from request body match, or there wasn't an id given in the request body go to next function.  Else, return 400
  if (dishId == id || !id) {
    next();
  } else if (id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
};

//GET Request validation

/**
 * Checks if dish exists with id of the dishId parameter given in route
 */
const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const foundDish = dishes.find(({ id }) => id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    next();
  } else {
    next({ status: 404, message: `Dish does not exist: ${dishId}` });
  }
};

//**   CRUDL Functions   **//

const list = (req, res, next) => {
  res.json({ data: dishes });
};

const create = (req, res, next) => {
  const { name, price, description, image_url } = res.locals;
  const newDish = {
    id: nextId(),
    name,
    price,
    description,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};


const read = (req, res, next) => {
  const { dish } = res.locals;
  res.json({ data: dish });
};

const update = (req, res, next) => {
  const { dish } = res.locals;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
};

const destroy = (req, res, next) => {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dishId === dish.id);
  const deletedDish = dishes.splice(index, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  create: [
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    validateName,
    validateDescription,
    validateImageUrl,
    validatePrice,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    validateName,
    validateDescription,
    validateImageUrl,
    validatePrice,
    dishIdMatches,
    update,
  ],
  delete: [dishExists, destroy]
};
