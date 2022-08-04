const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//**   Validation Middleware Functions   **//

//PUT and POST validation
 
/**
 * Checks if a property name was given in the request body.
 * Function is to be called on PUT and POST requests
 * If the specified property name exists in the body, as value to res locals.
 * If not, return 400
 */
function bodyHasData (propertyName) {
  return function(req, res, next){
    const { data = {} } = req.body;
    if (data[propertyName]) {
      res.locals[propertyName] = data[propertyName];
      next();
    } else {
      next({ status: 400, message: `Order must include a ${propertyName}` });
    }
  };
};

/**
 * Checks if the value of DeliverTo property in request body is not ""
 * Function is to be called on PUT and POST requests
 */
function validateDeliverTo (req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  deliverTo.length
    ? next()
    : next({ status: 400, message: `Order must include a deliverTo` });
};

/**
 * Checks if the value of mobileNumber property in request body is not ""
 * Function is to be called on PUT and POST requests
 */
function validateMobileNumber (req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  mobileNumber.length
    ? next()
    : next({ status: 400, message: `Order must include a mobileNumber` });
};


/**
 * Checks if the value of Dishes property in request body is an array and is not empty
 * Function is to be called on PUT and POST requests
 */
function validateDishes (req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.length && Array.isArray(dishes)
    ? next()
    : next({ status: 400, message: `Order must include at least one dish` });
};

/**
 * Checks if the quantity of the Dish array in request body is an integer and is greater than 0
 * Function is to be called on PUT and POST requests
 */
function validateDishQuantity (req, res, next) {
  //call local dishes array added from bodyHasData function
  const { dishes } = res.locals;
  //find the index of the dishes array where the quantity is not an integer or the quantity was less than zero
  const dishWrongQty = dishes.findIndex(
    ({ quantity }) => !Number.isInteger(quantity) || quantity <= 0
  );
  //if a match was found return 400, else go to next function
  dishWrongQty !== -1
    ? next({
        status: 400,
        message: `Dish ${dishWrongQty} must have a quantity that is an integer greater than 0`,
      })
    : next();
};

/**
 * Checks if the orderId in the route and the Id given in the request body match.  
 * Function is to be called on a PUT request. 
 * Request will not complete if data and route id's do not match. 
 * It is to be noted that there may not be an id given in the data.  However, the request can still be completed if it is not given
 */
function orderIdMatches (req, res, next) {
  //get the orderId parameter from the route
  const { orderId } = req.params;
  //get the data id from the request body
  const { data: { id } = {} } = req.body;
  //if both id's match or no id given in request body, call next function.
  if (orderId == id || !id) {
    next();
  } else if (id !== orderId) {
    //else, return 400
    next({
      status: 400,
      message: `Order id does not match route id. Dish: ${id}, Route: ${orderId}`,
    });
  }
};

/**
 * Checks the status on an order in a PUT request to see if the status is not delivered and is one of "pending", "preparing", or "out-for-delivery"
 */
function validateStatusForUpdate (req, res, next) {
  const validStatus = ["pending", "preparing", "out-for-delivery"];
  const { status } = res.locals;
  if (status === "delivered")
    next({ status: 400, message: `A delivered order cannot be changed` });
  validStatus.includes(status)
    ? next()
    : next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
      });
};

//GET & DELETE request validation

/**
 * Checks if orderId given in request parameters exists in the orders data. 
 * Function is to be called on GET and DELETE request on a route with orderId parameter
 */
function orderExists (req, res, next){
  const { orderId } = req.params;
  const foundOrder = orders.find(({ id }) => id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  } else {
    next({ status: 404, message: `Order does not exist: ${orderId}` });
  }
};

/**
 * Checks if status on an order is "pending".
 * Function to be called on DELETE request.  
 * Orders can only be deleted if status is pending
 */
function checkStatusIsPending (req, res, next) {
  const { order } = res.locals;
  order.status === "pending"
    ? next()
    : next({
        status: 400,
        message: "An order cannot be deleted unless it is pending",
      });
};

//**   CRUDL Functions   **//

function list(req, res, next){
  res.json({ data: orders });
};

function create(req, res, next){
  const { deliverTo, mobileNumber, dishes } = res.locals;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "pending",
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

function read(req, res, next){
  const { order } = res.locals;
  res.status(200).json({ data: order });
};

function update(req, res, next){
  const { order } = res.locals;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.status(200).json({ data: order });
};

function destroy(req, res, next){
  const { orderId } = req.params;
  const index = orders.findIndex(({ id }) => id === orderId);
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
};

module.exports = {
  list,
  create: [
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    validateDeliverTo,
    validateMobileNumber,
    validateDishes,
    validateDishQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    orderIdMatches,
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("status"),
    bodyHasData("dishes"),
    validateDeliverTo,
    validateMobileNumber,
    validateStatusForUpdate,
    validateDishes,
    validateDishQuantity,
    update,
  ],
  delete: [orderExists, checkStatusIsPending, destroy],
};
