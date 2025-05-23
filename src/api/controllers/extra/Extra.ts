import { Enquiry } from '@/api/entity/extra/Enquiry';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';
import * as validator from 'validator';
import { QueryRunner } from 'typeorm';
import { Letter } from '@/api/entity/extra/Letter';

export const createEnquiry = async (req: Request, res: Response) => {
  try {
    const { fullName, mobileNumber, emailAddress, query } = req.body;

    if (!fullName?.trim() || !mobileNumber?.trim() || !emailAddress?.trim() || !query?.trim()) {
      res.status(400).json({ status: "error", message: "Fullname, email, mobileNumber, and query are required!" });
      return;
    }

    const enquiryRepo = AppDataSource.getRepository(Enquiry);

    const enquiry = enquiryRepo.create({
      fullName,
      mobileNumber,
      emailAddress,
      query
    });

    await enquiryRepo.save(enquiry);

    res.status(201).json({ status: "success", message: "New enquiry created" });

  } catch (error) {
    console.error("Error in createEnquiry:", error);
    res.status(500).json({ status: "error", message: "Something went wrong!" });
  }
}


export const createLetter = async (req: Request, res: Response): Promise<void> => {
  const queryRunner: QueryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const { emailAddress, createdBy = 'system', updatedBy = 'system' } = req.body;

    // Validation 1: Check required fields
    if (!emailAddress) {
      res.status(400).json({
        status: 'error',
        message: 'Email address is required',
      });
      return;
    }

    // Validation 2: Validate email format
    if (!validator.isEmail(emailAddress)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid email address format',
      });
      return;
    }

    // Check for existing email
    const existingLetter = await queryRunner.manager.findOne(Letter, {
      where: { emailAddress }
    });

    if (existingLetter) {
      res.status(400).json({
        status: 'error',
        message: 'You have already subscribed.',
      });
      return;
    }

    // Create new letter
    const newLetter = new Letter();
    newLetter.emailAddress = emailAddress;
    newLetter.createdBy = createdBy;
    newLetter.updatedBy = updatedBy;

    // Save within transaction
    await queryRunner.manager.save(newLetter);
    await queryRunner.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Letter created successfully',
      data: {
        letter: {
          id: newLetter.id,
          emailAddress: newLetter.emailAddress,
          createdAt: newLetter.createdAt
        }
      }
    });
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error creating letter:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating letter',
    });
  } finally {
    await queryRunner.release();
  }
};