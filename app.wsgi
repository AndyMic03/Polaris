import sys
import os

# Add project directory to sys.path
sys.path.insert(0, '/home/hostingesncy/polaris')

# Add virtual environment's site-packages to sys.path
sys.path.insert(0, '/home/hostingesncy/polaris/polaris-env/lib/python3.7/site-packages')

# Set environment variables to activate virtual environment
os.environ['VIRTUAL_ENV'] = '/home/hostingesncy/polaris/polaris-env'
os.environ['PATH'] = '/home/hostingesncy/polaris/polaris-env/bin:' + os.environ['PATH']
os.environ['PYTHONHOME'] = '/home/hostingesncy/polaris/polaris-env'

# Import the Flask app
from app import app as application
