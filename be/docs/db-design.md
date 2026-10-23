data base design

- user
  - name =>[string ,required ,minLength (3),maxLength(20),trim]
  - email =>[string ,required ,unique,trim,lowercase,match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)]
  - password =>[string ,required in case provider is local ]
  - provider [google ,facebook , local]

  - isDeleted [boolean,default false]

  - isVerified [boolean,default false]

  - dob [Date]

  - gender [string ,required ,enum('male','female')]

  - createdAt [date ,default now]
  
  - updatedAt [date ,default now]

--------------------------------------

messages

- content [string ,required ,minLength (1),maxLength(200),trim]
- receiver [objectId ,required ,ref:user]
- sender [objectId ,optional ,ref:user]
- isDeleted [boolean ,default false]
- createdAt [date ,default now]
- updatedAt [date ,default now]


--------------------------------------
otp [ one time password]
- code         [string ,required ,length:6 ]
- email        [string ,required ,trim ,lowercase]
- expiresAt    [Date ,required ]
- createdAt    [date ,default now]
