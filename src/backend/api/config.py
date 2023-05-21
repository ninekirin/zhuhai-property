# -*- encoding: utf-8 -*-

import os
from datetime import timedelta

"""
CREATE USER 'zhproperty'@'%' IDENTIFIED VIA mysql_native_password USING '***';GRANT USAGE ON *.* TO 'zhproperty'@'%' REQUIRE NONE WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0;CREATE DATABASE IF NOT EXISTS `zhproperty`;GRANT ALL PRIVILEGES ON `zhproperty`.* TO 'zhproperty'@'%';
"""


class BaseConfig():

    USE_SQLITE = os.getenv('USE_SQLITE', 'True') == 'True'
    BASE_DIR = os.path.dirname(os.path.realpath(__file__))

    if USE_SQLITE:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'zhproperty.db')
    else:
        HOSTNAME = os.getenv('MYSQLHOST', 'localhost')
        PORT = os.getenv('MYSQLPORT', '3306')
        DATABASE = os.getenv('MYSQLDATABASE', 'zhproperty')
        USERNAME = os.getenv('MYSQLUSER', 'zhproperty')
        PASSWORD = os.getenv('MYSQLPASSWORD', '3q5HA(QXnb2+ayD')
        CHARSET = os.getenv('MYSQLCHARSET', 'utf8mb4')
        SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://{}:{}@{}:{}/{}?charset={}'.format(
            USERNAME, PASSWORD, HOSTNAME, PORT, DATABASE, CHARSET)

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'AdMiNiStRaToR_39')
    SECRET_KEY = os.getenv('SECRET_KEY', 'S#perS3crEt_913')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'S#perS3crEt_JWT')

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)