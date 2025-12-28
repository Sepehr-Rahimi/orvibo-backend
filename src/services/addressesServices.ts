import { Op } from "sequelize";
import { UserRoles } from "../enums/userRolesEnum";
import { addressesAttributes, initModels } from "../models/init-models";
import { pick } from "../utils/dataUtils";
import { AppError } from "../utils/error";

const Addresses = initModels().addresses;
const Orders = initModels().orders;

export const createAddressService = async (
  data: addressesAttributes
): Promise<addressesAttributes> => {
  const { user_id, is_default } = data;

  // user_id comes from req.user?.id
  if (!user_id) {
    throw new AppError("لطفا ابتدا وارد شوید", 401);
  }

  if (is_default) {
    const preDefaultAddress = await Addresses.findOne({
      where: {
        user_id,
        is_default: true,
      },
    });

    if (preDefaultAddress) {
      preDefaultAddress.is_default = false;
      preDefaultAddress.save();
    }
  }

  const newAddress = await Addresses.create(
    pick(data, [
      "user_id",
      "is_home",
      "full_name",
      "latin_full_name",
      "phone_number",
      "address",
      "city",
      "province",
      "zipcode",
      "is_default",
    ])
  );

  return newAddress;
};

export const listAddressesService = async (user_id: number) => {
  if (!user_id) throw new AppError("User ID is required", 400);

  const addresses = await Addresses.findAll({ where: { user_id } });

  return addresses;
};

export const addressByIdService = async (
  addressId: number | string,
  userId: number
) => {
  const address = await Addresses.findByPk(addressId);

  if (!address) {
    throw new AppError("Cant find address", 404);
  }

  if (address.user_id !== userId) {
    throw new AppError("access denied", 401);
  }

  return address;
};

export const updateAddressService = async (
  data: addressesAttributes & {
    addressId: number | string;
    reqUserId: number | string;
  }
) => {
  const { addressId, reqUserId } = data;
  const address = await Addresses.findByPk(addressId);

  if (!address) {
    throw new AppError("cant find address", 404);
  }
  if (address.user_id !== reqUserId) {
    throw new AppError("access denied", 401);
  }

  const dataForModify = pick(data, [
    "is_home",
    "full_name",
    "latin_full_name",
    "phone_number",
    "address",
    "city",
    "province",
    "zipcode",
    "is_default",
  ]);

  await address.update(dataForModify);

  return address;
};

export const deleteAddressService = async (data: {
  addressId: number | string;
  reqUserId: number | string;
}) => {
  const { addressId, reqUserId } = data;
  const address = await Addresses.findByPk(addressId);

  if (!address) {
    throw new AppError("cant find address", 404);
  }

  const ordersUsingAddress = await Orders.count({
    where: { address_id: addressId },
  });

  if (ordersUsingAddress > 0) {
    throw new AppError(`${ordersUsingAddress} سفارش با این آدرس ثبت شده است`);
  }

  if (address.user_id !== reqUserId) {
    throw new AppError("access denied", 401);
  }

  await address.destroy();
};

export const searchAddressesService = async (data: {
  user?: { role: UserRoles; id: number | string };
  search?: string;
}) => {
  if (!data.user) {
    throw new AppError("user not found", 401);
  }

  const { user, search } = data;
  if (!search) {
    throw new AppError("لطفا اسم یا شماره شخص آدرس را وارد کنید");
  }
  const isAdmin = user.role == UserRoles.Admin;
  const whereClause: any = {};

  // Only filter by user_id if not admin
  if (!isAdmin) {
    whereClause.user_id = user.id;
  }

  // Add search conditions if search exists
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { phone_number: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const addresses = await Addresses.findAll({
    where: whereClause,
  });

  return addresses;
};
