import { Resolver, Query, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import { questions } from '../db/schema';
import { QuestionsService } from './questions.service';

@ObjectType()
class QuestionSubjectCount {
  @Field()
  subject!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
class QuestionListResponse {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  totalPages!: number;

  @Field(() => [String])
  questionIds!: string[];
}

@Resolver()
export class QuestionsResolver {
  constructor(private readonly questionsService: QuestionsService) {}

  @Query(() => [QuestionSubjectCount])
  async questionSubjects() {
    return this.questionsService.getPublishedSubjectCounts();
  }

  @Query(() => QuestionListResponse)
  async questionSearch(
    @Args('q') q: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('limit', { type: () => Int, nullable: true }) limit = 20,
  ) {
    const result = await this.questionsService.search({
      q,
      page,
      limit,
    });

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      questionIds: (result.data as any[]).map((question) => question.questionId),
    };
  }
}
