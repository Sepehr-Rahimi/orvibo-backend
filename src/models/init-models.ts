import { QueryInterface, type Sequelize } from "sequelize";
import { addresses as _addresses } from "./addresses";
import type {
  addressesAttributes,
  addressesCreationAttributes,
} from "./addresses";
import { blogs as _blogs } from "./blogs";
import { bank_accounts as _bank_accounts } from "./bank_account";

import type { blogsAttributes, blogsCreationAttributes } from "./blogs";
import { brands as _brands } from "./brands";
import type { brandsAttributes, brandsCreationAttributes } from "./brands";
import { categories as _categories } from "./categories";
import type {
  categoriesAttributes,
  categoriesCreationAttributes,
} from "./categories";
import { order_items as _order_items } from "./order_items";
import type {
  order_itemsAttributes,
  order_itemsCreationAttributes,
} from "./order_items";
import { orders as _orders } from "./orders";
import type { ordersAttributes, ordersCreationAttributes } from "./orders";
import { products as _products } from "./products";
import type {
  productsAttributes,
  productsCreationAttributes,
} from "./products";
import { users as _users } from "./users";
import type { usersAttributes, usersCreationAttributes } from "./users";
import sequelize from "../config/database";
import { discount_codes as _discount_codes } from "./discount_codes";
import {
  discount_codesAttributes,
  discount_codesCreationAttributes,
} from "./discount_codes";
import { banners as _banners } from "./banners";
import { bannersAttributes, bannersCreationAttributes } from "./banners";
import {
  verification_codes as _verification_codes,
  verification_codes,
} from "./verification_codes";
import {
  verification_codesAttributes,
  verification_codesCreationAttributes,
} from "./verification_codes";
import { products_embedding as _products_embedding } from "./products_embedding";
import type {
  products_embeddingAttributes,
  products_embeddingCreationAttributes,
} from "./products_embedding";
import { variables as _variables } from "./variables";
import type {
  variablesAttributes,
  variablesCreationAttributes,
} from "./variables";

import type {
  bank_accountsAttributes,
  bank_accountsCreationAttributes,
} from "./bank_account";

export {
  _addresses as addresses,
  _blogs as blogs,
  _brands as brands,
  _categories as categories,
  _order_items as order_items,
  _orders as orders,
  _products as products,
  _users as users,
  _discount_codes as discount_codes,
  _banners as banner,
  _verification_codes as verification_codes,
  _products_embedding as products_embedding,
  _variables as variables,
  _bank_accounts as bank_accounts,
};

export type {
  addressesAttributes,
  addressesCreationAttributes,
  blogsAttributes,
  blogsCreationAttributes,
  brandsAttributes,
  brandsCreationAttributes,
  categoriesAttributes,
  categoriesCreationAttributes,
  order_itemsAttributes,
  order_itemsCreationAttributes,
  ordersAttributes,
  ordersCreationAttributes,
  productsAttributes,
  productsCreationAttributes,
  usersAttributes,
  usersCreationAttributes,
  discount_codesAttributes,
  discount_codesCreationAttributes,
  bannersAttributes,
  bannersCreationAttributes,
  verification_codesAttributes,
  verification_codesCreationAttributes,
  products_embeddingAttributes,
  products_embeddingCreationAttributes,
  variablesAttributes,
  variablesCreationAttributes,
  bank_accountsAttributes,
  bank_accountsCreationAttributes,
};

export function initModels() {
  const addresses = _addresses.initModel(sequelize);
  const blogs = _blogs.initModel(sequelize);
  const brands = _brands.initModel(sequelize);
  const categories = _categories.initModel(sequelize);
  const order_items = _order_items.initModel(sequelize);
  const orders = _orders.initModel(sequelize);
  const products = _products.initModel(sequelize);
  const users = _users.initModel(sequelize);
  const discount_codes = _discount_codes.initModel(sequelize);
  const banners = _banners.initModel(sequelize);
  const verification_codes = _verification_codes.initModel(sequelize);
  const products_embedding = _products_embedding.initModel(sequelize);
  const variables = _variables.initModel(sequelize);
  const bank_accounts = _bank_accounts.initModel(sequelize);

  order_items.associate({
    orders,
    products,
  });

  orders.associate({
    addresses,
    order_items,
    users,
  });

  products.associate({
    products_embedding,
    categories,
    brands,
  });

  return {
    addresses: addresses,
    blogs: blogs,
    brands: brands,
    categories: categories,
    order_items: order_items,
    orders: orders,
    products: products,
    users: users,
    discount_codes: discount_codes,
    banners: banners,
    verification_codes: verification_codes,
    products_embedding: products_embedding,
    variables: variables,
    bank_accounts: bank_accounts,
  };
}
