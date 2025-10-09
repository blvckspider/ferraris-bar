# Ferraris Bar


## Server Tech Stack
- **Runtime system:** Node.js
- **HTTP framework:** Express
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + refresh token
- **Testing:** Jest
- **Development tooling:** Nodemon, ESLint, Prettier

## Endpoints
### Authentication
- [POST] Login (/auth/login)
- [POST] Refresh (/auth/refresh)
- [POST] Logout (/auth/logout)

### Orders
- [GET] All orders (/orders)
- [GET] Order by ID (/orders/:id)
- [POST] Create Order (/orders)
- [PUT] Update order (/orders/:id)
- [DELETE] Delete order (/orders/:id)

### Products
- [GET] All products (/products)
- [GET] Product by ID (/products/:id)
- [POST] Create Product (/products)
- [PUT] Update product (/products/:id)
- [DELETE] Delete product (/products/:id)

### Users
- [GET] All users (/users)
- [GET] User by ID (/users/:id)
- [POST] Create user (/users)
- [PUT] Update user (/users/:id)
- [DELETE] Delete user (/users/:id)