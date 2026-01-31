import { Request, Response } from 'express';
import {prisma} from '../lib/prisma';
import { AuthRequest, JwtPayload } from '../Middleware/authMiddleware';
import { cache, keyGenerator } from '../utils/cache';
import { error } from 'console';


// Create a new Category
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
            return res.status(400).json({ error: "Request body is missing" });
        }
    const { nom } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!nom) {
      return res.status(400).json({ error: 'Name (nom) is required' });
    }

    const categorie = await prisma.categorie.findFirst({
      where:{
        utilisateurId:userId,
        nom,
      }
    })

    if(categorie){
      return res.status(402).json({error:"that category is already exist "})
    }

    const newCategory = await prisma.categorie.create({
      data: {
        nom,
        utilisateurId: userId,
      },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all Categories for the logged-in user
export const getAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const cacheInfo = keyGenerator(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const categories = await prisma.categorie.findMany({
      where: {
        utilisateurId: userId,
      },
      orderBy: {
        nom: 'asc',
      },
    });

    cache(cacheInfo,categories);

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single Category by ID
export const getCategoryById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID provided' });

    const category = await prisma.categorie.findFirst({
      where: {
        id: id,
        utilisateurId: userId, // Ensure ownership
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a Category
export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
    const id = parseInt(req.params.id);

    if (!req.body) {
        return res.status(400).json({ error: "Request body is missing" });
    }
    const { nom } = req.body;
    const userId = req.user?.id;


    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID provided' });

    // 1. Verify existence and ownership
    const existingCategory = await prisma.categorie.findFirst({
      where: { id, utilisateurId: userId },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // 2. Update
    const updatedCategory = await prisma.categorie.update({
      where: { id },
      data: { nom },
    });

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a Category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID provided' });

    // 1. Verify existence and ownership
    const existingCategory = await prisma.categorie.findFirst({
      where: { id, utilisateurId: userId },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // 2. Delete
    await prisma.categorie.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete this category because it is used in existing transactions.' 
      });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};