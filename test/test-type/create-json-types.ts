export type MyString = string;
export type Id = number | MyString;
export type Name = {
    firstName: MyString;
};

export type User = {
    id: Id;
    name: Name;
};
