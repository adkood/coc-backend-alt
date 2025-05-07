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
      enrollmentNumber,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'All fields are required: first name, last name, email address and password.',
      });
      return;
    }

    if (!validator.isEmail(email)) {
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
      res.status(400).json({
        status: 'error',
        message:
          'Password must be at least 8 characters long and include uppercase letters, lowercase letters and digits.',
      });
      return;
    }

    if (firstName.length > 50 || lastName.length > 50) {
      res.status(400).json({
        status: 'error',
        message: 'First name and last name must not exceed 50 characters.',
      });
      return;
    }

    // const enrollmentNumberRegex = /^(COC|Bmv)\d{11}$/;
    // if (!enrollmentNumberRegex.test(enrollmentNumber)) {
    //   res.status(400).json({
    //     status: 'error',
    //     message: 'Invalid enrollment number format.',
    //   });
    //   return;
    // }

    const userLoginRepository = queryRunner.manager.getRepository(Users);

    let practiceType;
    if(enrollmentNumber)
    {
    try {
      const isValidPracticeOrderRes = await axios.get(`http://www.crm.coceducation.com/API/VerifyOrderNo?orderNo=${enrollmentNumber}`);
      console.log("order id  check :",isValidPracticeOrderRes);
      practiceType = isValidPracticeOrderRes.data;
    } catch (error) {
      console.log("Error in rollno verification :", error);
    }
  }

    console.log(practiceType);

    const newUser = userLoginRepository.create({
      firstName,
      lastName,
      emailAddress: email,
      password,
      enrollmentNumber,
      enrollmentType: practiceType?.IsSuccess ? 'practice' : 'basic',
      createdBy,
      updatedBy,
    });

    console.log(newUser);
    await userLoginRepository.save(newUser);

    await queryRunner.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Signup completed successfully. Please verify your email.',
      data: {
        user: newUser,
        practiceType
      }
    });
  } catch (error: any) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error during signup:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        status: 'error',
        message: 'This email is already in use.',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  } finally {
    await queryRunner.release();
  }
};
