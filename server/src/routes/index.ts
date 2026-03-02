import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder } from '../controllers/orderController';
import { getUsers, getUser, createUser, updateUser, deleteUser, loginUser } from '../controllers/userController';
import { getSubscribers, subscribe, deleteSubscriber } from '../controllers/subscriberController';

export const productRouter = Router();
productRouter.get('/', getProducts);
productRouter.get('/:id', getProduct);
productRouter.post('/', createProduct);
productRouter.put('/:id', updateProduct);
productRouter.delete('/:id', deleteProduct);

export const categoryRouter = Router();
categoryRouter.get('/', getCategories);
categoryRouter.get('/:id', getCategory);
categoryRouter.post('/', createCategory);
categoryRouter.put('/:id', updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export const orderRouter = Router();
orderRouter.get('/', getOrders);
orderRouter.get('/:id', getOrder);
orderRouter.post('/', createOrder);
orderRouter.put('/:id', updateOrder);
orderRouter.delete('/:id', deleteOrder);

export const userRouter = Router();
userRouter.get('/', getUsers);
userRouter.get('/:id', getUser);
userRouter.post('/', createUser);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);
userRouter.post('/auth/login', loginUser);

export const subscriberRouter = Router();
subscriberRouter.get('/', getSubscribers);
subscriberRouter.post('/', subscribe);
subscriberRouter.delete('/:id', deleteSubscriber);
