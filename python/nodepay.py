from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Create a new instance of the Chrome driver
driver = webdriver.Chrome()

# Navigate to the login page
driver.get("https://example.com/login")

# Find the username and password fields
username_field = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.NAME, "username"))
)
password_field = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.NAME, "password"))
)

# Enter the username and password
username_field.send_keys("your_username")
password_field.send_keys("your_password")

# Find the login button
login_button = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.NAME, "login"))
)

# Click the login button
login_button.click()

# Wait for the login to complete
WebDriverWait(driver, 10).until(
    EC.title_is("Dashboard")
)

# Print the title of the page
print(driver.title)

# Close the browser window
driver.quit()