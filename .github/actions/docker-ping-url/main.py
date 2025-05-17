import os 
import requests
import time

def website_reacable(url, delay, max_trials):
    trials = 0
    while trials < max_trials:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"website {url} is reacable")
                return True 
        except requests.ConnectionError:
            print(f"website {url} is unreacable. Retrying in {delay} seconds...")
            time.sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            print(f"invalid URL format: {url} make sure the URL has a valid schema")
            return False 
    return False

def run():
    website_url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS"))

    website_reacable = ping_url(website_url, delay, max_trials)
    
    if not website_reacable:
        raise Exception(f"website {website_url} is malformed or unreacable")

    print(f"website {website_url} is reacable")
    
if __name__ == "__main__":
    run()