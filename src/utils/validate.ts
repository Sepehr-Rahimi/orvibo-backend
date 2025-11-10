import Joi from "joi";

export const userSignupSchema = Joi.object({
  firstName: Joi.string().required().min(3).max(50),
  lastName: Joi.string().required().min(3).max(50),
  phone: Joi.string().required(), // Validate phone number
  password: Joi.string().required().min(6).max(50),
  code: Joi.string().required().min(6),
});

export const userLoginSchema = Joi.object({
  phone: Joi.string().required(), // Validate phone number
  password: Joi.string().required().min(6).max(50),
});

export const userUpdateProfileSchema = Joi.object({
  firstName: Joi.string().required().min(3).max(50),
  lastName: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required().min(3).max(50),
});

export const userChangePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().min(6).max(50),
  newPassword: Joi.string().required().min(6).max(50),
});
export const userResetPasswordSchema = Joi.object({
  password: Joi.string().required().min(6).max(50),
  phone_or_email: Joi.string().required(),
  code: Joi.string().required(),
});
export const userVerifySchema = Joi.object({
  phone_or_email: Joi.string().required(),
  code: Joi.string().required(),
});

export const createBrandSchema = Joi.object({
  name: Joi.string().required(),
  website_url: Joi.string().required(),
  description: Joi.string().required(),
  english_name: Joi.string().required(),
  is_active: Joi.boolean(),
});
export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  parent_id: Joi.string(),
});
export const createProductsSchema = Joi.object({
  name: Joi.string().required(),
  summary: Joi.string().required(),
  description: Joi.string().required(),
  code: Joi.string().required(),
  model: Joi.string().required(),
  stock: Joi.string().required(),
  category_id: Joi.string().required(),
  brand_id: Joi.string().required(),
  colors: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  kinds: Joi.array().items(Joi.string()),
  label: Joi.string().allow(""),
  currency_price: Joi.string().required(),
  discount_percentage: Joi.string(),
  is_published: Joi.boolean(),
  main_features: Joi.array().items(Joi.string()),
});

export const updateProductsSchema = Joi.object({
  name: Joi.string(),
  summary: Joi.string(),
  description: Joi.string(),
  code: Joi.string(),
  model: Joi.string(),
  stock: Joi.string(),
  category_id: Joi.string(),
  brand_id: Joi.string(),
  colors: Joi.array().items(Joi.string()),
  sizes: Joi.array().items(Joi.string()),
  kinds: Joi.array().items(Joi.string()),
  label: Joi.string().allow(""),
  currency_price: Joi.string(),
  discount_percentage: Joi.string(),
  is_published: Joi.boolean(),
  main_features: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string()),
  orderImages: Joi.array(),
});

export const createAddressSchema = Joi.object({
  is_home: Joi.boolean(),
  full_name: Joi.string().required(),
  phone_number: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().required(),
  zipcode: Joi.string().required(),
  is_default: Joi.boolean(),
});

export const updateAddressSchema = Joi.object({
  is_home: Joi.boolean(),
  full_name: Joi.string(),
  phone_number: Joi.string(),
  address: Joi.string(),
  city: Joi.string(),
  province: Joi.string(),
  zipcode: Joi.string(),
  is_default: Joi.boolean(),
});

export const createOrderSchema = Joi.object({
  address_id: Joi.number().required(),
  // total_cost: Joi.number().required(),
  discount_code: Joi.string().allow(""),
  // discount_amount: Joi.number(),
  // delivery_cost: Joi.number().required(),
  type_of_delivery: Joi.number().required(),
  type_of_payment: Joi.string().required(),
  callback_url: Joi.string().allow(""),
  description: Joi.string().allow(""),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().required(),
        quantity: Joi.number().required(),
        color: Joi.string().allow(null),
        size: Joi.string().allow(null),
        type: Joi.string().allow(null),
        price: Joi.number().required(),
      })
    )
    .required(),
});

export const createOrderAdminSchema = Joi.object({
  address_id: Joi.number().required(),
  // total_cost: Joi.number().required(),
  // discount_code: Joi.string().allow(""),
  discount_amount: Joi.number(),
  // delivery_cost: Joi.number().required(),
  type_of_delivery: Joi.number().required(),
  type_of_payment: Joi.string().required(),
  callback_url: Joi.string().allow(""),
  description: Joi.string().allow(""),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().required(),
        quantity: Joi.number().required(),
        color: Joi.string().allow(null),
        size: Joi.string().allow(null),
        type: Joi.string().allow(null),
        price: Joi.number().required(),
      })
    )
    .required(),
});

export const updateOrderSchema = Joi.object({
  address_id: Joi.number(),
  total_cost: Joi.number(),
  discount_code: Joi.string(),
  discount_amount: Joi.number(),
  delivery_cost: Joi.number(),
  other_costs: Joi.string(),
  status: Joi.string(),
  type_of_delivery: Joi.number(),
  payment_status: Joi.number(),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().required(),
      quantity: Joi.number().required(),
      color: Joi.string(),
      size: Joi.string(),
      type: Joi.string(),
      price: Joi.number().required(),
    })
  ),
});

export const createBlogSchema = Joi.object({
  title: Joi.string().required(),
  summary: Joi.string().required(),
  content: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).required(),
  meta_title: Joi.string().allow(""),
  meta_description: Joi.string().allow(""),
  meta_keywords: Joi.array().items(Joi.string()).required(),
  is_published: Joi.boolean(),
});

export const updateBlogSchema = Joi.object({
  id: Joi.string(),
  title: Joi.string(),
  summary: Joi.string(),
  content: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  meta_title: Joi.string().allow(""),
  meta_description: Joi.string().allow(""),
  meta_keywords: Joi.array().items(Joi.string()),
  is_published: Joi.boolean(),
});

export const createDiscountCodeSchema = Joi.object({
  code: Joi.string().required(),
  type: Joi.string().valid("fixed", "percentage").required(),
  value: Joi.number().required(),
  min_order: Joi.string().required(),
  max_uses: Joi.number().required(),
  max_amount: Joi.number().optional(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  active: Joi.boolean(),
  user_specific: Joi.boolean(),
});
export const updateDiscountCodeSchema = Joi.object({
  id: Joi.number().required(),
  code: Joi.string(),
  type: Joi.string().valid("fixed", "percentage"),
  value: Joi.number(),
  min_order: Joi.string(),
  max_uses: Joi.number(),
  max_amount: Joi.number().optional(),
  start_date: Joi.date(),
  end_date: Joi.date(),
  active: Joi.boolean(),
  user_specific: Joi.boolean(),
});

export const createBannerSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  button_text: Joi.string().required(),
  link: Joi.string().required(),
  is_published: Joi.boolean(),
});

export const updateBannerSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  button_text: Joi.string(),
  link: Joi.string(),
  is_published: Joi.boolean(),
});

export const sendVerificationCodeSchema = Joi.object({
  phone_or_email: Joi.string().required(),
});
