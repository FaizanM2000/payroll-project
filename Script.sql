create table employees (
Pk_Employee_SSN int primary key not null,
password varchar(500) not null,
firstName varchar(50) ,
lastName varchar(50) ,
jobTitle varchar(50) ,
salaryType varchar(6),
performance varchar(50) ,
hoursWorkedThisYear int,
hoursWorkedThisCycle int,
wage int ,
Fk_Tax_Id int,
Fk_Bonus_Id int,
Fk_Benefits_Id int,
Fk_Insurance_Id int,
foreign key(Fk_Tax_Id) references tax(Pk_Tax_Id) on delete set null,
foreign key(Fk_Bonus_Id) references bonus(Pk_Bonus_Id) on delete set null,
foreign key(Fk_Benefits_Id) references benefits(Pk_Benefits_Id) on delete set null,
foreign key(Fk_Insurance_Id) references insurance(Pk_Insurance_Id) on delete set null
);

create table dependent (
Pk_Dependent_SSN int primary key not null,
firstName varchar(50),
lastName varchar(50),
relation varchar(50),
Fk_Benefits_Id int,
Fk_Employee_SSN int not null,
foreign key(Fk_Benefits_Id) references benefits(Pk_Benefits_Id) on delete set null,
foreign key(Fk_Employee_SSN) references employees(Pk_Employee_SSN) on delete cascade
);

create table tax (
Pk_Tax_Id int primary key not null,
stateRate int not null,
federalRate int not null
);

create table bonus (
Pk_Bonus_Id int primary key not null,
allocatedPercentage int not null
);

create table benefits (
Pk_Benefits_Id int primary key not null,
healthPlan int not null,
contributionPlan int not null,
attorneyPlan int not null,
lifeInsurance int not null
);

create table insurance (
Pk_Insurance_Id int primary key not null,
individualCost int not null,
familyCost int not null,
employeePaidPremium int not null,
employerPaidPremium int not null
);
