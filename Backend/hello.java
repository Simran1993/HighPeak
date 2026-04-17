class Main {
    public static void main(String[] args) {
        String[] name = {"Priyanca", "Priya", "Pratibha"};

        printName(name);
    }

    public static void printName(String[] name) {
        for (int i = 0; i < name.length; i++) {
            System.out.println(name[i]);
        }
    }
}