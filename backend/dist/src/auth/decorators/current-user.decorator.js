"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
exports.CurrentUser = (0, common_1.createParamDecorator)((_, context) => {
    if (context.getType() === 'http') {
        return context.switchToHttp().getRequest().user;
    }
    const gqlContext = graphql_1.GqlExecutionContext.create(context);
    return gqlContext.getContext().req?.user;
});
//# sourceMappingURL=current-user.decorator.js.map