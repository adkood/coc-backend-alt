import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import validator, { isVAT } from 'validator';
import { Users } from '@/api/entity/user/Users';
import axios from 'axios';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const {
      firstName,
      lastName,
      email,
      password,
      userType = 'new',
      enrollmentNumber,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    // Input validation
    if (!firstName || !lastName || !email || !password) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        status: 'error',
        message: 'All fields are required: first name, last name, email address and password.',
      });
      return;
    }

    if (!validator.isEmail(email)) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        status: 'error',
        message: 'Invalid email address format.',
      });
      return;
    }

    const passwordMinLength = 8;
    if (
      password.length < passwordMinLength ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long and include uppercase, lowercase letters and digits.',
      });
      return;
    }

    if (firstName.length > 50 || lastName.length > 50) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        status: 'error',
        message: 'First name and last name must not exceed 50 characters.',
      });
      return;

    }

    const userLoginRepository = queryRunner.manager.getRepository(Users);

    // Check for existing email
    const isEmailPresent = await userLoginRepository.findOne({ where: { emailAddress: email } });
    if (isEmailPresent) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({ status: "error", message: "Email address already used!" });
      return;

    }

    // Check for existing enrollment number if provided
    if (enrollmentNumber) {
      const isEnrollmentUsed = await userLoginRepository.findOne({ where: { enrollmentNumber } });
      if (isEnrollmentUsed) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ status: "error", message: "Enrollment Number already used!" });
        return;
      }
    }

    let enrollmentType;
    if (userType === 'new') {
      enrollmentType = 'basic';
    } else {
      if (!enrollmentNumber) {
        await queryRunner.rollbackTransaction();
        res.status(400).json({ status: "error", message: "Enrollment number is required for non-new users" });
        return;
      }

      try {
        const isValidPracticeOrderRes = await axios.get(
          `http://www.crm.coceducation.com/API/VerifyOrderNo?orderNo=${enrollmentNumber}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (!isValidPracticeOrderRes.data?.IsSuccess) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ status: "error", message: "Invalid CFM enrollment number!" });
          return;

        }

        enrollmentType = 'practice';
      } catch (error) {
        console.error("Error in enrollment verification:", error);
        await queryRunner.rollbackTransaction();
        res.status(400).json({ status: "error", message: "Error in enrollment verification!" });
        return;

      }

      try {
        const isValidPracticeOrderRes = await axios.get(
          `http://www.crc.coceducation.com/API/VerifyOrderNo?orderNo=${enrollmentNumber}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (!isValidPracticeOrderRes.data?.IsSuccess) {
          await queryRunner.rollbackTransaction();
          res.status(400).json({ status: "error", message: "Invalid CFM enrollment number!" });
          return;

        }

        enrollmentType = 'practice';
      } catch (error) {
        console.error("Error in enrollment verification:", error);
        await queryRunner.rollbackTransaction();
        res.status(400).json({ status: "error", message: "Error in enrollment verification!" });
        return;
      }
    }

    const newUser = userLoginRepository.create({
      firstName,
      lastName,
      emailAddress: email,
      password: password,
      enrollmentNumber: enrollmentNumber || null,
      enrollmentType: enrollmentType as 'basic' | 'practice',
      createdBy,
      updatedBy,
    });

    await userLoginRepository.save(newUser);
    await queryRunner.commitTransaction();


    res.status(201).json({
      status: 'success',
      message: 'Signup completed successfully.',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.emailAddress,
          enrollmentType: newUser.enrollmentType
        }
      }
    });

  } catch (error: any) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error during signup:', error);

    res.status(500).json({
      status: 'error',
      message: 'Internal server error during signup',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  } finally {
    await queryRunner.release();
  }
};