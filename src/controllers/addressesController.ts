import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/requestsTypes";
import {
  addressByIdService,
  createAddressService,
  deleteAddressService,
  listAddressesService,
  searchAddressesService,
  updateAddressService,
} from "../services/addressesServices";

// Create a new address
export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newAddress = await createAddressService({
      ...req.body,
      user_id: req.user?.id,
    });

    res.status(201).json({
      message: "Address created successfully",
      address: newAddress,
    });
  } catch (error) {
    next(error);
  }
};

// Get a list of addresses for a specific user
export const listAddresses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const addresses = await listAddressesService(req.user?.id);
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    next(error);
  }
};

// Get a single address by ID
export const getAddressById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const address = await addressByIdService(id, req.user.id);

    res.status(200).json({ success: true, address });
  } catch (error) {
    next(error);
  }
};

// Update an address
export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const address = await updateAddressService({
      ...req.body,
      addressId: id,
      reqUserId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    next(error);
  }
};

// Delete an address
export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const address = await deleteAddressService({
      addressId: id,
      reqUserId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const searchAddresses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // console.log(req.params);
  const { search } = req.query;

  try {
    const addresses = await searchAddressesService({
      user: req.user,
      search: search?.toString(),
    });

    res.status(200).json({ addresses, success: true });
  } catch (error) {
    next(error);
  }
};
