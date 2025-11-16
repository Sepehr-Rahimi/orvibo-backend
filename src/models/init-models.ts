import type { Sequelize } from "sequelize";
import { addresses as _addresses } from "./addresses";
import type {
  addressesAttributes,
  addressesCreationAttributes,
} from "./addresses";
import { bank_accounts as _bank_accounts } from "./bank_accounts";
import type {
  bank_accountsAttributes,
  bank_accountsCreationAttributes,
} from "./bank_accounts";
import { banners as _banners } from "./banners";
import type { bannersAttributes, bannersCreationAttributes } from "./banners";
import { blogs as _blogs } from "./blogs";
import type { blogsAttributes, blogsCreationAttributes } from "./blogs";
import { brands as _brands } from "./brands";
import type { brandsAttributes, brandsCreationAttributes } from "./brands";
import { categories as _categories } from "./categories";
import type {
  categoriesAttributes,
  categoriesCreationAttributes,
} from "./categories";
import { discount_codes as _discount_codes } from "./discount_codes";
import type {
  discount_codesAttributes,
  discount_codesCreationAttributes,
} from "./discount_codes";
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
import { products_embedding as _products_embedding } from "./products_embedding";
import type {
  products_embeddingAttributes,
  products_embeddingCreationAttributes,
} from "./products_embedding";
import { products_variants as _products_variants } from "./products_variants";
import type {
  products_variantsAttributes,
  products_variantsCreationAttributes,
} from "./products_variants";
import { users as _users } from "./users";
import type { usersAttributes, usersCreationAttributes } from "./users";
import { variables as _variables } from "./variables";
import type {
  variablesAttributes,
  variablesCreationAttributes,
} from "./variables";
import { verification_codes as _verification_codes } from "./verification_codes";
import type {
  verification_codesAttributes,
  verification_codesCreationAttributes,
} from "./verification_codes";
import sequelize from "../config/database";

export {
  _addresses as addresses,
  _bank_accounts as bank_accounts,
  _banners as banners,
  _blogs as blogs,
  _brands as brands,
  _categories as categories,
  _discount_codes as discount_codes,
  _order_items as order_items,
  _orders as orders,
  _products as products,
  _products_embedding as products_embedding,
  _products_variants as products_variants,
  _users as users,
  _variables as variables,
  _verification_codes as verification_codes,
};

export type {
  addressesAttributes,
  addressesCreationAttributes,
  bank_accountsAttributes,
  bank_accountsCreationAttributes,
  bannersAttributes,
  bannersCreationAttributes,
  blogsAttributes,
  blogsCreationAttributes,
  brandsAttributes,
  brandsCreationAttributes,
  categoriesAttributes,
  categoriesCreationAttributes,
  discount_codesAttributes,
  discount_codesCreationAttributes,
  order_itemsAttributes,
  order_itemsCreationAttributes,
  ordersAttributes,
  ordersCreationAttributes,
  productsAttributes,
  productsCreationAttributes,
  products_embeddingAttributes,
  products_embeddingCreationAttributes,
  products_variantsAttributes,
  products_variantsCreationAttributes,
  usersAttributes,
  usersCreationAttributes,
  variablesAttributes,
  variablesCreationAttributes,
  verification_codesAttributes,
  verification_codesCreationAttributes,
};

export function initModels() {
  const addresses = _addresses.initModel(sequelize);
  const bank_accounts = _bank_accounts.initModel(sequelize);
  const banners = _banners.initModel(sequelize);
  const blogs = _blogs.initModel(sequelize);
  const brands = _brands.initModel(sequelize);
  const categories = _categories.initModel(sequelize);
  const discount_codes = _discount_codes.initModel(sequelize);
  const order_items = _order_items.initModel(sequelize);
  const orders = _orders.initModel(sequelize);
  const products = _products.initModel(sequelize);
  const products_embedding = _products_embedding.initModel(sequelize);
  const products_variants = _products_variants.initModel(sequelize);
  const users = _users.initModel(sequelize);
  const variables = _variables.initModel(sequelize);
  const verification_codes = _verification_codes.initModel(sequelize);

  orders.belongsTo(addresses, { as: "address", foreignKey: "address_id" });
  addresses.hasMany(orders, { as: "orders", foreignKey: "address_id" });
  products.belongsTo(brands, { as: "brand", foreignKey: "brand_id" });
  brands.hasMany(products, { as: "products", foreignKey: "brand_id" });
  categories.belongsTo(categories, { as: "parent", foreignKey: "parent_id" });
  categories.hasMany(categories, { as: "categories", foreignKey: "parent_id" });
  products.belongsTo(categories, { as: "category", foreignKey: "category_id" });
  categories.hasMany(products, { as: "products", foreignKey: "category_id" });
  order_items.belongsTo(orders, { as: "order", foreignKey: "order_id" });
  orders.hasMany(order_items, { as: "order_items", foreignKey: "order_id" });
  order_items.belongsTo(products, { as: "product", foreignKey: "product_id" });
  products.hasMany(order_items, {
    as: "order_items",
    foreignKey: "product_id",
  });
  products_embedding.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(products_embedding, {
    as: "products_embeddings",
    foreignKey: "product_id",
  });
  products_variants.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(products_variants, {
    as: "variants",
    foreignKey: "product_id",
  });
  order_items.belongsTo(products_variants, {
    as: "variant",
    foreignKey: "variant_id",
  });
  products_variants.hasMany(order_items, {
    as: "order_items",
    foreignKey: "variant_id",
  });
  addresses.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(addresses, { as: "addresses", foreignKey: "user_id" });
  orders.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(orders, { as: "orders", foreignKey: "user_id" });

  return {
    addresses: addresses,
    bank_accounts: bank_accounts,
    banners: banners,
    blogs: blogs,
    brands: brands,
    categories: categories,
    discount_codes: discount_codes,
    order_items: order_items,
    orders: orders,
    products: products,
    products_embedding: products_embedding,
    products_variants: products_variants,
    users: users,
    variables: variables,
    verification_codes: verification_codes,
  };
}
