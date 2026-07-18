import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ExamService } from '../src/exam/exam.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const examService = app.get(ExamService);

  try {
    const loginRes = await authService.loginWithCbtKey('CBT-C52V82');
    console.log('Logged in!');
    
    // The user's ID is the subject of the token
    // Let's get the user id directly
    const user = await authService['userModel'].findOne({ cbt_key: 'CBT-C52V82' });
    if (!user) throw new Error('User not found');

    console.log('Creating session...', user.userId);
    const session = await examService.createSession(user.userId, 'mock');
    console.log('Session created!', session.sessionId);
  } catch (err: any) {
    console.error('Error occurred:', err.message);
    if (err.response) {
      console.error(err.response);
    } else {
      console.error(err);
    }
  }
  
  await app.close();
}

bootstrap();
