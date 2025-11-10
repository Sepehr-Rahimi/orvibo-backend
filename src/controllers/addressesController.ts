import { Request, Response } from "express";
import { initModels } from "../models/init-models";
import { AuthenticatedRequest } from "../types/requestsTypes";
import { Op } from "sequelize";

const Addresses = initModels().addresses;

// Create a new address
export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user_id = req?.user.id;

  try {
    const {
      is_home,
      full_name,
      phone_number,
      address,
      city,
      province,
      zipcode,
      is_default,
    } = req.body;

    if (is_default) {
      const preDefaultAddress = await Addresses.findOne({
        where: {
          is_default: true,
        },
      });

      if (preDefaultAddress) {
        preDefaultAddress.is_default = false;
        preDefaultAddress.save();
      }
    }

    const newAddress = await Addresses.create({
      user_id,
      is_home,
      full_name,
      phone_number,
      address,
      city,
      province,
      zipcode,
      is_default,
    });

    res.status(201).json({
      message: "Address created successfully",
      address: newAddress,
    });
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a list of addresses for a specific user
export const listAddresses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const user_id = req.user.id;

  try {
    const addresses = await Addresses.findAll({ where: { user_id } });

    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get a single address by ID
export const getAddressById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const address = await Addresses.findByPk(id);

    if (!address) {
      res.status(404).json({ success: false, message: "Address not found." });
      return;
    }

    if (address.user_id !== req?.user?.id) {
      res.status(403).json({ success: false, message: "No access." });
      return;
    }

    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update an address
export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const address = await Addresses.findByPk(id);

    if (!address) {
      res.status(404).json({ success: false, message: "Address not found." });
      return;
    }
    if (address.user_id !== req?.user?.id) {
      res.status(403).json({ success: false, message: "No access." });
      return;
    }

    const {
      is_home,
      full_name,
      phone_number,
      address: newAddress,
      city,
      province,
      zipcode,
      is_default,
    } = req.body;

    await address.update({
      is_home,
      full_name,
      phone_number,
      address: newAddress,
      city,
      province,
      zipcode,
      is_default: is_default === "true",
    });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete an address
export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const address = await Addresses.findByPk(id);

    if (!address) {
      res.status(404).json({ success: false, message: "Address not found." });
      return;
    }
    if (address.user_id !== req?.user?.id) {
      res.status(403).json({ success: false, message: "No access." });
      return;
    }

    await address.destroy();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const searchAddresses = async (req: Request, res: Response) => {
  console.log(req.params);
  const { search } = req.query;

  if (!search) {
    res
      .status(400)
      .json({ message: "لطفا متن جست و جو را وارد کنید", success: false });
    return;
  }
  try {
    const addresses = await Addresses.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { phone_number: { [Op.iLike]: `%${search}%` } },
        ],
      },
    });

    res.status(200).json({ addresses, success: true });
  } catch (error) {
    res.status(500).json({ message: "server error", success: false });
    return;
  }
};
