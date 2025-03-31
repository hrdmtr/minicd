# MiniCD Development Guidelines

## Build & Test Commands
- Build: `npm run build`
- Run dev server: `npm run dev`
- Lint: `npm run lint`
- Format code: `npm run format` 
- Test (all): `npm run test`
- Test (single): `npm run test -- -t "test name"`

## Project Structure
- `/src/models` - Database models
- `/src/controllers` - Request handlers
- `/src/routes` - API routes
- `/src/services` - Business logic & external services
- `/src/middleware` - Express middleware
- `/src/config` - Configuration modules

## Code Style Guidelines
- **Formatting**: Use Prettier with 100 char line length
- **Imports**: Group as (1)standard library, (2)external, (3)internal
- **Types**: Use TypeScript with strict mode and explicit return types
- **Naming**: 
  - camelCase for variables/functions
  - PascalCase for classes/interfaces
  - UPPER_SNAKE for constants
- **Error Handling**: Try/catch with AppError class in controllers
- **Async Pattern**: Use async/await consistently, not callbacks
- **Documentation**: JSDoc comments for all public methods

Follow SOLID principles. Avoid deeply nested code. Write tests for all API endpoints.