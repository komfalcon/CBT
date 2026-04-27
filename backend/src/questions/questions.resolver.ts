import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Question } from './schemas/question.schema';
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
    const result = await this.questionsService.searchQuestions({
      q,
      page,
      limit,
    });

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      questionIds: (result.data as Question[]).map((question) => question.questionId),
    };
  }
}
