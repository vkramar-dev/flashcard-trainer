\# Flashcard Trainer — Agent Instructions



\## Project



Flashcard Trainer is a full-stack web application for creating flashcard sets, training with them, and tracking learning statistics.



This repository contains both the frontend and backend.



\## Repository Structure



\### Frontend



Path:



`frontend/`



Technology stack:



\- React 18

\- TypeScript

\- Vite

\- Redux Toolkit

\- React Router

\- Material UI (MUI)

\- Axios



Important directories:



\- `frontend/src/api` — HTTP/API access

\- `frontend/src/features` — feature-specific Redux/UI code

\- `frontend/src/pages` — application pages

\- `frontend/src/store` — Redux store configuration

\- `frontend/src/theme` — MUI themes

\- `frontend/src/types` — shared frontend types

\- `frontend/src/utils` — utility functions



The application uses the shared Axios instance defined in:



`frontend/src/api/client.ts`



Presentation components should not call Axios directly.



\### Backend



Solution:



`backend/KramarDev.FlashcardTrainer/KramarDev.FlashcardTrainer.slnx`



Web API project:



`backend/KramarDev.FlashcardTrainer/KramarDev.FlashcardTrainer.WebAPI/`



Technology stack:



\- ASP.NET Core Web API

\- .NET 10

\- C#

\- Entity Framework Core

\- SQL Server

\- ASP.NET Core Identity

\- JWT authentication



Main backend directories:



\- `Controllers` — HTTP API controllers

\- `Services` — application/business logic

\- `Services/Interfaces` — service interfaces

\- `Models` — API models and DTOs

\- `Database` — EF Core DbContext, migrations and initialization

\- `Database/Tables` — persistence entities



\## Local Development URLs



Frontend:



`http://localhost:3000`



Backend HTTPS:



`https://localhost:7291`



Development API base URL:



`https://localhost:7291/api`



Production frontend:



`https://new-words.online`



Production API:



`https://api.new-words.online/api`



\## Build Commands



Commands should normally be executed from the repository root.



\### Backend



Build:



```powershell

dotnet build backend/KramarDev.FlashcardTrainer/KramarDev.FlashcardTrainer.slnx

```



Run:



```powershell

dotnet run --project backend/KramarDev.FlashcardTrainer/KramarDev.FlashcardTrainer.WebAPI/KramarDev.FlashcardTrainer.WebAPI.csproj --launch-profile https

```



\### Frontend



Install dependencies when necessary:



```powershell

cd frontend

npm ci

```



Lint:



```powershell

npm run lint

```



Build and TypeScript validation:



```powershell

npm run build

```



The build script already executes:



`tsc --noEmit \&\& vite build`



Run development server:



```powershell

npm run dev

```



The Vite development server runs on port 3000.



\## Backend Architecture



Keep controllers thin.



Business logic belongs primarily in services.



Database access uses Entity Framework Core and SQL Server.



`IDbContextFactory<FlashcardsDbContext>` is registered and used when operations require independently created DbContext instances.



SQL Server retry support is enabled with:



`EnableRetryOnFailure()`.



Some set update/import operations intentionally use:



\- EF Core execution strategies

\- explicit database transactions

\- `UPDLOCK`

\- `ROWLOCK`



These mechanisms serialize concurrent modifications of the same set.



Do not remove or substantially change this concurrency behavior unless explicitly requested.



\## Backend Coding Rules



\- Prefer simple, explicit C# code.

\- Do not introduce abstractions without a clear benefit.

\- Use asynchronous database and I/O APIs.

\- Propagate `CancellationToken` through asynchronous operations where appropriate.

\- Preserve ownership checks based on the authenticated user.

\- Preserve database constraints and validation unless a change is explicitly required.

\- Do not silently change transaction boundaries or retry behavior.

\- Do not perform broad architectural refactoring unless explicitly requested.

\- Follow the existing Controller → Service → EF Core structure.



When modifying existing behavior, inspect the current implementation before proposing a replacement.



\## API Contracts



Frontend and backend are part of the same application.



When changing:



\- endpoint URLs

\- HTTP methods

\- request models

\- response models

\- field names

\- nullability

\- authentication behavior



always inspect both sides of the contract.



Relevant frontend API code is primarily under:



`frontend/src/api/`



Relevant backend API code is primarily under:



`Controllers/` and `Models/`.



Do not change one side of an API contract without checking the other side.



\## Frontend Architecture



Use functional React components and TypeScript.



Use the existing Redux Toolkit architecture for application state.



Use the existing centralized API layer instead of making arbitrary Axios calls from UI components.



Use Material UI for application UI and styling.



Follow existing feature organization before creating new folders or abstractions.



Avoid duplicating backend business rules unnecessarily in the frontend.



\## Verification



For backend-only changes:



1\. Build the backend.

2\. Inspect compiler warnings and errors.

3\. Exercise the affected API behavior when practical.



For frontend-only changes:



1\. Run `npm run lint`.

2\. Run `npm run build`.

3\. Check the affected UI in the browser when practical.



For full-stack changes:



1\. Inspect both frontend and backend implementations.

2\. Build the backend.

3\. Run frontend lint.

4\. Build the frontend.

5\. Start the backend.

6\. Start the frontend.

7\. Open the application in the browser.

8\. Exercise the affected user workflow.

9\. Inspect browser console errors.

10\. Inspect relevant network requests and responses.

11\. Fix discovered problems and verify the workflow again.



Do not claim that a change works unless it has been verified appropriately.



\## Agent Working Style



Before making a significant change:



1\. Inspect the relevant code.

2\. Trace related code and API contracts.

3\. Understand the existing implementation.

4\. Make the smallest reasonable change.

5\. Build and/or test the affected area.

6\. Report what changed.

7\. Report how the change was verified.



Prefer targeted changes over speculative rewrites.



Do not replace working code merely because another pattern is newer or more fashionable.



If the existing design appears intentional, understand why it exists before changing it.



\## Security



Never expose or commit:



\- SQL Server passwords

\- connection strings containing credentials

\- JWT signing keys

\- API keys

\- access tokens

\- production secrets



Do not print secrets into logs, chat output, generated documentation, or source code.



Use configuration/environment mechanisms already established by the project.

