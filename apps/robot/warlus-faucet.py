import time
import os

def execute_command_a():
    print("Current time: ", time.strftime("%Y-%m-%d %H:%M:%S"))
    os.system("sui client faucet --address=0x4275dcac5c4abd78f8adccb90f778820c4731f130056b4477af54de50d9a1238")

def main():
    while True:
        execute_command_a()
        time.sleep(61 * 60)

if __name__ == "__main__":
    main()