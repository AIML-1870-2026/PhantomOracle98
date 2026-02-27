while True:
    print("\n1. Inches → Centimeters")
    print("2. Pounds → Kilograms")
    print("3. Fahrenheit → Celsius")
    print("4. Exit")

    choice = input("Enter choice: ").strip()

    if choice == "1":
        inches = float(input("Enter inches: "))
        cm = inches * 2.54
        print(f"{inches} inches = {cm:.2f} centimeters")
    elif choice == "2":
        pounds = float(input("Enter pounds: "))
        kg = pounds * 0.45359237
        print(f"{pounds} pounds = {kg:.2f} kilograms")
    elif choice == "3":
        f = float(input("Enter Fahrenheit: "))
        c = (f - 32) * 5 / 9
        print(f"{f} °F = {c:.2f} °C")
    elif choice == "4":
        print("Goodbye.")
        break
    else:
        print("Invalid choice. Try again.")
