# -*- encoding: utf-8 -*-

import base64
from datetime import datetime, timezone
from functools import wraps
import imghdr
import io
import threading

from flask import Response, request
from flask_restx import Api, Resource, fields

import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib import font_manager

import jwt
import requests

from .models import db, User, JWTTokenBlocklist, Announcement, Property
from .config import BaseConfig
from .analysis import generate_analysis_report

font_manager.fontManager.addfont('PingfangSC-Regular.ttf')
# for font in font_manager.fontManager.ttflist:
#     # 查看字体名以及对应的字体文件名
#     print(font.name, '-', font.fname)
plt.switch_backend('Agg')
plt.rcParams['font.sans-serif'] = ['.PingFang SC']

# 创建线程互斥锁
mutex = threading.Lock()

rest_api = Api(version="1.0", title="Zhuhai Property API",
               description="Zhuhai Property API")  # , doc=True, add_specs=False)


"""
    Flask-Restx models for api request and response data
"""

signup_model = rest_api.model('SignUpModel', {"username": fields.String(required=True, min_length=4, max_length=50),
                                              "password": fields.String(required=True, min_length=8, max_length=50)
                                              })

login_model = rest_api.model('LoginModel', {"username": fields.String(required=True, min_length=4, max_length=50),
                                            "password": fields.String(required=True, min_length=8, max_length=50)
                                            })


change_password_model = rest_api.model('ChangePasswordModel', {"old_password": fields.String(required=True, min_length=8, max_length=50),
                                                               "new_password": fields.String(required=True, min_length=8, max_length=50)
                                                               })

announcement_create_model = rest_api.model(
    'AnnouncementCreateModel', {"title": fields.String(required=True, max_length=50),
                                "content": fields.String(required=True)})

announcement_edit_model = rest_api.model(
    'AnnouncementEditModel', {"id": fields.Integer(required=True),
                              "title": fields.String(max_length=128),
                              "content": fields.String()})

announcement_delete_model = rest_api.model(
    'AnnouncementDeleteModel', {"id": fields.Integer(required=True)})


user_edit_model = rest_api.model('UserEditModel', {"user_id": fields.Integer(required=True),
                                                   "username": fields.String(required=True, min_length=4, max_length=50),
                                                   "account_type": fields.String(required=True, max_length=50),
                                                   "account_status": fields.String(required=True, max_length=50),
                                                   })

user_delete_model = rest_api.model(
    'UserDeleteModel', {"user_id": fields.Integer(required=True)})

user_password_edit_model = rest_api.model(
    'UserPasswordEditModel', {"user_id": fields.Integer(required=True),
                              "new_password": fields.String(required=True, min_length=8, max_length=50)})

"""
    Flask-Restx api routes
"""


"""
   JWT token required
"""


def token_required(f):

    @wraps(f)
    def decorator(*args, **kwargs):

        token = None

        if "authorization" in request.headers:
            token = request.headers["authorization"]

        if not token:
            return {"success": False, "message": "Valid JWT token is missing."}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY,
                              algorithms=["HS256"])
            current_user = User.get_by_username(data["username"])

            if not current_user:
                return {"success": False,
                        "message": "Sorry. Wrong auth token. This user does not exist."}, 400

            token_expired = db.session.query(
                JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar()

            if token_expired is not None:
                return {"success": False, "message": "Token revoked. Please re-login."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "message": "Token expired. Please re-login."}, 400

        except:
            return {"success": False, "message": "Token expired or token is invalid. Please re-login."}, 400

        return f(current_user, *args, **kwargs)

    return decorator


def admin_required(f):

    @wraps(f)
    def decorator(*args, **kwargs):

        token = None

        if "authorization" in request.headers:
            token = request.headers["authorization"]

        if not token:
            return {"success": False, "message": "Valid JWT token is missing."}, 400

        try:
            data = jwt.decode(token, BaseConfig.SECRET_KEY,
                              algorithms=["HS256"])
            current_user = User.get_by_username(data["username"])

            if not current_user:
                return {"success": False,
                        "message": "Sorry. Wrong auth token. This user does not exist."}, 400

            token_expired = db.session.query(
                JWTTokenBlocklist.id).filter_by(jwt_token=token).scalar()

            if token_expired is not None:
                return {"success": False, "message": "Token revoked. Please re-login."}, 400

            if not current_user.check_jwt_auth_active():
                return {"success": False, "message": "Token expired. Please re-login."}, 400

            if not current_user.check_account_type() == "admin":
                return {"success": False, "message": "You are not an admin."}, 400

            # print("admin_required: " + str(current_user))

        except Exception as e:
            return {"success": False, "message": "Token expired or token is invalid. Please re-login."}, 400

        return f(current_user, *args, **kwargs)

    return decorator


"""
    Flask-Restx routes
"""


@rest_api.route('/api/users/register')
class Register(Resource):
    """
       Creates a new user by taking 'signup_model' input
    """

    @rest_api.expect(signup_model, validate=True)
    def post(self):

        req_data = request.get_json()

        username = req_data.get("username")
        password = req_data.get("password")

        user_exists = User.get_by_username(username)

        if user_exists:
            return {"success": False,
                    "message": "username " + username + " already taken."}, 400

        new_user = User(username=username)

        new_user.set_password(password)

        if password == BaseConfig.ADMIN_PASSWORD:
            new_user.set_account_type("admin")
            new_user.set_account_status("activated")
        else:
            new_user.set_account_type("user")
            new_user.set_account_status("activated")

        new_user.save()

        return {"success": True,
                "user": new_user.toJSON(),
                "message": "The user was successfully registered."}, 200


@rest_api.route('/api/users/login')
class Login(Resource):
    """
       Login user by taking 'login_model' input and return JWT token
    """

    @rest_api.expect(login_model, validate=True)
    def post(self):

        req_data = request.get_json()

        username = req_data.get("username")
        password = req_data.get("password")

        user_exists = User.get_by_username(username)

        if not user_exists:
            return {"success": False,
                    "message": "User " + username + " does not exist."}, 400

        if not user_exists.check_password(password):
            return {"success": False,
                    "message": "Wrong credentials."}, 400

        # account status check
        if not user_exists.check_account_status() == "activated":
            return {"success": False,
                    "message": "Your account has been deactivated. Please contact the IT staff for further information."}, 400

        # create access token uwing JWT
        token = jwt.encode({'username': username, 'exp': datetime.utcnow(
        ) + BaseConfig.JWT_ACCESS_TOKEN_EXPIRES}, BaseConfig.SECRET_KEY, algorithm="HS256")

        # update user's last_online
        user_exists.set_last_online()

        # set JWT token active
        user_exists.set_jwt_auth_active(True)
        user_exists.save()

        return {"success": True,
                "token": token,
                "user": user_exists.toJSON(),
                "message": "The user was successfully logged in."}, 200


@rest_api.route('/api/users/edit/password')
class ChangePassword(Resource):
    """
       Edits User's password using 'change_password_model' input
    """

    @rest_api.expect(change_password_model)
    @token_required
    def post(self, current_user):

        req_data = request.get_json()

        old_password = req_data.get("old_password")
        new_password = req_data.get("new_password")

        changepw_user = User.get_by_user_id(self.user_id)

        if not changepw_user:
            return {"success": False,
                    "message": "User does not exist."}, 400

        if not changepw_user.check_password(old_password):
            return {"success": False,
                    "message": "Wrong old password."}, 400

        if old_password == new_password:
            return {"success": False,
                    "message": "New password cannot be the same as the old password."}, 400

        if not changepw_user.check_account_status() == "activated":
            return {"success": False,
                    "message": "Your account has been deactivated. Please contact the IT staff for further information."}, 400

        # too short
        if len(new_password) < 8:
            return {"success": False,
                    "message": "Password must be at least 8 characters long."}, 400

        if new_password:
            changepw_user.set_password(new_password)

        changepw_user.save()

        return {"success": True,
                "user": self.toJSON(),
                "message": "The password has successfully changed."}, 200


@rest_api.route('/api/users/keepalive')
class KeepAliveUser(Resource):
    """
       Keep user online using 'keepalive_model' input
    """

    @token_required
    def get(self, current_user):

        # update access token uwing JWT
        token = jwt.encode({'username': self.username, 'exp': datetime.utcnow(
        ) + BaseConfig.JWT_ACCESS_TOKEN_EXPIRES}, BaseConfig.SECRET_KEY)

        # update user's last online time
        self.set_last_online()

        self.set_jwt_auth_active(True)
        self.save()

        return {"success": True,
                "token": token,
                "user": self.toJSON(),
                "message": "The user was successfully kept alive."}, 200


@rest_api.route('/api/users/get/info')
class GetUserInfo(Resource):
    """
       Returns user_info and helper_info using 'user_info_model' input
    """

    @token_required
    def get(self, current_user):

        # get the info from helper, user table
        user_info = User.get_by_user_id(self.user_id)

        return {"success": True,
                "info": {
                    "user_info": user_info.toJSON(),
                },
                "message": "The full info was successfully returned."}, 200


@rest_api.route('/api/users/logout')
class LogoutUser(Resource):
    """
       Logs out User using 'logout_model' input
    """

    @token_required
    def get(self, current_user):

        _jwt_token = request.headers["authorization"]

        jwt_block = JWTTokenBlocklist(
            jwt_token=_jwt_token, created_at=datetime.now(timezone.utc))
        jwt_block.save()

        self.set_jwt_auth_active(False)
        self.save()

        return {"success": True,
                "message": "The user was successfully logged out."}, 200


@rest_api.route('/api/manage/announcement/create')
class CreateAnnouncement(Resource):
    """
       Create announcement
    """

    @rest_api.expect(announcement_create_model, validate=True)
    @admin_required
    def post(self, current_user):

        req_data = request.get_json()

        current_user = User.get_by_user_id(self.user_id)
        title = req_data.get("title")
        content = req_data.get("content")

        if req_data:
            # create announcement
            new_announcement = Announcement(user_id=current_user.user_id,
                                            title=title,
                                            content=content)
            new_announcement.save()

        return {"success": True,
                "message": "The announcement was successfully created."}, 200


@rest_api.route('/api/manage/announcement/edit')
class EditAnnouncement(Resource):
    """
       Edit announcement
    """

    @rest_api.expect(announcement_edit_model, validate=True)
    @admin_required
    def post(self, current_user):

        req_data = request.get_json()

        id = req_data.get("id")

        # get sth from announcement table
        current_announcement = Announcement.get_by_id(id)

        # if announcement does not exist
        if not current_announcement:
            return {"success": False,
                    "message": "Announcement does not exist."}, 400

        if req_data:
            # update announcement
            current_announcement.set_title(req_data.get("title"))
            current_announcement.set_content(req_data.get("content"))
            current_announcement.save()

        return {"success": True,
                "message": "The announcement was successfully edited."}, 200


@rest_api.route('/api/manage/announcement/delete')
class DeleteAnnouncement(Resource):
    """
       Delete announcement
    """

    @rest_api.expect(announcement_delete_model, validate=True)
    @admin_required
    def post(self, current_user):

        req_data = request.get_json()

        id = req_data.get("id")

        # get sth from announcement table
        current_announcement = Announcement.get_by_id(id)

        # if announcement does not exist
        if not current_announcement:
            return {"success": False,
                    "message": "Announcement does not exist."}, 400

        if req_data:
            # delete announcement
            current_announcement.delete_announcement()

        return {"success": True,
                "message": "The announcement was successfully deleted."}, 200


@rest_api.route('/api/announcement/get')
class GetAnnouncement(Resource):
    """
       Get announcement
    """

    @token_required
    def get(self, current_user):

        req_data = request.args
        id = req_data.get("id")

        # get sth from announcement table
        current_announcement = Announcement.get_by_id(id)

        return {"success": True,
                "announcement": current_announcement.toJSON(),
                "message": "The announcement was successfully returned."}, 200


@rest_api.route('/api/announcement/get/all')
class GetAllAnnouncements(Resource):
    """
       Get all announcements
    """

    @token_required
    def get(self, current_user):

        # get all announcements
        announcements = Announcement.get_all_announcements()
        total = Announcement.get_total_announcements()

        return {"success": True,
                "info": {
                    "total": total,
                },
                "announcements": [announcement.toJSON() for announcement in announcements],
                "message": "All announcements were successfully returned."}, 200


@rest_api.route('/api/announcement/get/pagination')
class GetPaginatedAnnouncements(Resource):
    """
       Get paginated announcements
    """

    @token_required
    def get(self, current_user):

        req_data = request.get_json()

        # pagination
        curr_page = req_data.get("current", 1, type=int)
        page_size = req_data.get("pageSize", 10, type=int)

        # get paginated announcements
        announcements = Announcement.get_part_announcements(
            curr_page, page_size)
        total = Announcement.get_total_announcements()

        return {"success": True,
                "info": {
                    "current": curr_page,
                    "pageSize": page_size,
                    "total": total,
                },
                "announcements": [announcement.toJSON() for announcement in announcements],
                "message": "Paginated announcements were successfully returned."}, 200


@rest_api.route('/api/manage/users/get/basic')
class GetUser(Resource):
    """
       Get User
    """

    @admin_required
    def get(self, current_user):

        req_data = request.args

        user_id = req_data.get("user_id")

        # get sth from user table
        current_user = User.get_by_user_id(user_id)

        return {"success": True,
                "user": current_user.toJSON(),
                "message": "The user was successfully returned."}, 200


@rest_api.route('/api/manage/users/get/basic/all')
class GetAllUsers(Resource):
    """
       Get All Users
    """

    @admin_required
    def get(self, current_user):

        # get all users
        users = User.get_all_users()

        return {"success": True,
                "info": {
                    "total": len(users),
                },
                "users": [user.toJSON() for user in users],
                "message": "All users were successfully returned."}, 200


@rest_api.route('/api/manage/users/get/basic/count')
class GetAllUsersCount(Resource):
    """
       Get All Users Count
    """

    @admin_required
    def get(self, current_user):

        # get all users count
        users_count = User.get_all_users_count()

        return {"success": True,
                "count": users_count,
                "message": "All users count was successfully returned."}, 200


@rest_api.route('/api/manage/users/get/basic/pagination')
class GetPaginationUsers(Resource):
    """
       Get Pagination Users
    """

    @admin_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # print(f"GET query查询参数: {req_data}")
        # GET query查询参数: ImmutableMultiDict([('currentPage', '1'), ('pageSize', '20')])

        # pagination
        curr_page = req_data.get("current", 1, type=int)
        page_size = req_data.get("pageSize", 10, type=int)

        # get all users
        users = User.get_part_users(curr_page, page_size)
        total = User.get_all_users_count()

        return {"success": True,
                "info": {
                    "current": curr_page,
                    "pageSize": page_size,
                    "total": total,
                },
                "users": [user.toJSON() for user in users.items],
                "message": "Showing {} users in total.".format(total)}, 200


@rest_api.route('/api/manage/users/edit/basic')
class EditUser(Resource):
    """
       Edits User's basic information using 'user_edit_model' input
    """

    @rest_api.expect(user_edit_model, validate=True)
    @admin_required
    def post(self, current_user):

        req_data = request.get_json()

        current_user = User.get_by_user_id(req_data.get("user_id"))

        if req_data:
            # update user info
            current_user.set_username(req_data.get("username"))
            current_user.set_account_type(req_data.get("account_type"))
            current_user.set_account_status(req_data.get("account_status"))

            current_user.save()

        return {"success": True,
                "user_id": req_data.get("user_id"),
                "message": "The user was successfully edited by the administrator."}, 200


@rest_api.route('/api/manage/users/edit/password')
class EditUserPassword(Resource):
    """
       Edits User's password using 'user_password_edit_model' input
    """

    @rest_api.expect(user_password_edit_model, validate=True)
    @admin_required
    def post(self, current_user):

        req_data = request.get_json()

        current_user = User.get_by_user_id(req_data.get("user_id"))

        if req_data:
            # update user password
            current_user.set_password(req_data.get("new_password"))

            current_user.save()

        return {"success": True,
                "user_id": req_data.get("user_id"),
                "message": "The user's password was successfully edited by the administrator."}, 200


@rest_api.route('/api/manage/users/delete')
class DeleteUser(Resource):
    """
       Delete User
    """

    @rest_api.expect(user_delete_model, validate=True)
    @admin_required
    def post(self, current_user):

        req_data = request.get_json()

        current_user = User.get_by_user_id(req_data.get("user_id"))

        # can not delete myself
        if current_user.user_id == self.user_id:
            return {"success": False,
                    "message": "You can not delete yourself."}, 400

        if req_data:
            # delete user
            current_user.delete_user()

        return {"success": True,
                "user_id": req_data.get("user_id"),
                "message": "The user was successfully deleted by the administrator."}, 200

# property


@rest_api.route('/api/property/get')
class GetProperty(Resource):
    """
       Get Property
    """

    @token_required
    def get(self, current_user):

        req_args = request.args

        id = req_args.get("id")

        # 判断 id 是否合法
        if id is None or id == "" or not id.isdigit():
            return {"success": False,
                    "message": "The property id is not valid."}, 400

        # get sth from property table
        property = Property.get_by_id(id)

        if not property:
            return {"success": False,
                    "message": "The property was not found."}, 404

        return {"success": True,
                "property": property.toJSON(),
                "message": "The property was successfully returned."}, 200


@rest_api.route('/api/property/get/all')
class GetAllProperties(Resource):
    """
       Get All Properties
    """

    @token_required
    def get(self, current_user):

        # get all properties
        properties, total = Property.get_all()

        return {"success": True,
                "info": {
                    "total": total,
                },
                "properties": [property.toJSON() for property in properties],
                "message": "All properties were successfully returned."}, 200


@rest_api.route('/api/property/get/all/count')
class GetAllPropertiesCount(Resource):
    """
       Get All Properties Count
    """

    @token_required
    def get(self, current_user):

        # get all properties count
        properties_count = Property.get_all_count()

        return {"success": True,
                "count": properties_count,
                "message": "All properties count was successfully returned."}, 200


@rest_api.route('/api/property/get/all/pagination')
class GetPaginationProperties(Resource):
    """
       Get Pagination Properties
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # print(f"GET query查询参数: {req_data}")
        # GET query查询参数: ImmutableMultiDict([('currentPage', '1'), ('pageSize', '20')])

        # pagination
        curr_page = req_data.get("current", 1, type=int)
        page_size = req_data.get("pageSize", 10, type=int)

        # get all properties
        properties, total = Property.get_part_properties(curr_page, page_size)

        # print(type(properties))

        return {"success": True,
                "info": {
                    "current": curr_page,
                    "pageSize": page_size,
                    "total": total,
                },
                "properties": [property.toJSON() for property in properties.items],
                "message": "Showing {} properties in total.".format(total)}, 200


# 这是一个测试

#     # @token_required
#     def get(self):

#         # get args
#         req_data = request.args

#         property = Property.get_by_custom(**req_data)

#         return {"success": True,
#                 "properties": property.toJSON(),
#                 "message": "The property was successfully returned."}, 200


@rest_api.route('/api/property/get/pagination')
class GetPaginationPropertiesByUser(Resource):
    """
       Get Custom Properties
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # print(f"GET query查询参数: {req_data}")
        # GET query查询参数: ImmutableMultiDict([('currentPage', '1'), ('pageSize', '20')])

        # pagination
        curr_page = req_data.get("current", 1, type=int)
        page_size = req_data.get("pageSize", 10, type=int)

        # immutableMultiDict to dict
        req_data = req_data.to_dict()

        # remove "current" and "pageSize" from Immutable req_data
        if "current" in req_data:
            del req_data["current"]
        if "pageSize" in req_data:
            del req_data["pageSize"]

        # get all properties
        properties, total = Property.get_by_custom(
            curr_page, page_size, **req_data)

        # print(type(properties))

        return {"success": True,
                "info": {
                    "current": curr_page,
                    "pageSize": page_size,
                    "total": total,
                },
                "properties": [property.toJSON() for property in properties.items],
                "message": "Showing {} properties in total.".format(total)}, 200


@rest_api.route('/api/property/search')
class SearchProperty(Resource):
    """
       Search Property
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # print(f"GET query查询参数: {req_data}")
        # GET query查询参数: ImmutableMultiDict([('currentPage', '1'), ('pageSize', '20')])

        # pagination
        curr_page = req_data.get("current", 1, type=int)
        page_size = req_data.get("pageSize", 10, type=int)

        # get keyword
        keyword = req_data.get("keyword")

        # get all properties
        properties, total = Property.search_paginated(
            curr_page, page_size, keyword)

        # print(type(properties))

        return {"success": True,
                "info": {
                    "current": curr_page,
                    "pageSize": page_size,
                    "total": total,
                },
                "properties": [property.toJSON() for property in properties.items],
                "message": "Showing {} properties in total.".format(total)}, 200


@rest_api.route('/api/property/getimg')
class GetPropertyImg(Resource):
    """
       Get Property Img
    """

    @token_required
    def get(self, current_user):

        req_args = request.args
        url = req_args.get("url")

        if url == None or url == "null":
            return {"success": False,
                    "message": "The property image was not found."}, 404

        # 下载图片
        img = requests.get(url)

        # 判断图片格式
        img_type = imghdr.what(None, img.content)

        if img_type == None:
            img_type = "jpeg"

        # # 返回图片内容
        # return Response(img.content, mimetype="image/{}".format(img_type))

        # print(img_type)

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img.content)

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The property image was successfully returned."}, 200


# 交易价格分布
@rest_api.route('/api/property/visualization/transaction_price_distribution')
class GetTransactionPriceDistribution(Resource):
    """
       Get Property Img
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("search")

        mutex.acquire()

        # 从数据库中获取数据
        data = Property.search(keyword).with_entities(
            Property.transaction_price).all()

        # 将数据存储到 pandas dataframe 中
        data_frame = pd.DataFrame(data)  # [row.__dict__ for row in data])

        # 如果数据为空，则返回错误信息
        if data_frame.empty:
            return {"success": False,
                    "message": "No data found."}, 400

        # 转换数据类型
        data_frame['transaction_price'] = data_frame['transaction_price'].astype(
            float)

        # 使用 pandas 和 matplotlib 生成图像
        plt.figure(figsize=(8, 6))

        data_frame['transaction_price'].plot(
            kind='hist', bins=100, color='blue', edgecolor='black', alpha=0.5)

        plt.title('Transaction Price Distribution')
        plt.xlabel('Transaction Price')
        plt.ylabel('Frequency')

        # 将生成的图像存储到 bytesIO 中，便于在网络上发送
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='svg')
        img_bytes.seek(0)

        # 关闭图像，防止内存泄漏
        plt.close()

        # 返回图片内容
        # return Response(img_bytes, mimetype="image/svg+xml")

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img_bytes.getvalue())

        # 判断图片格式
        img_type = "svg+xml"

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        mutex.release()

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The transaction price distribution image was successfully returned."}, 200

# 交易单价分布


@rest_api.route('/api/property/visualization/unit_price_distribution')
class GetUnitPriceImg(Resource):
    """
       Get Unit Price Img
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("search")

        mutex.acquire()

        # 从数据库中获取数据
        data = Property.search(keyword).with_entities(
            Property.unit_price).all()

        # 将数据存储到 pandas dataframe 中
        data_frame = pd.DataFrame(data)  # ([row.__dict__ for row in data])

        # 如果数据为空，则返回错误信息
        if data_frame.empty:
            return {"success": False,
                    "message": "No data found."}, 400

        # 转换数据类型
        data_frame['unit_price'] = data_frame['unit_price'].astype(float)

        # 使用 pandas 和 matplotlib 生成图像
        plt.figure(figsize=(8, 6))

        data_frame['unit_price'].plot(
            kind='hist', bins=100, color='blue', edgecolor='black', alpha=0.5)

        plt.title('Unit Price Distribution')
        plt.xlabel('Unit Price')
        plt.ylabel('Frequency')

        # 将生成的图像存储到 bytesIO 中，便于在网络上发送
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='svg')
        img_bytes.seek(0)

        # 关闭图像，防止内存泄漏
        plt.close()

        # 返回图片内容
        # return Response(img_bytes, mimetype="image/svg+xml")

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img_bytes.getvalue())

        # 判断图片格式
        img_type = "svg+xml"

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        mutex.release()

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The image was successfully returned."}, 200


# 绘制面积与成交价格的散点图：
@rest_api.route('/api/property/visualization/area_vs_transaction_price')
class GetAreaVsTransactionPrice(Resource):
    """
       Get Area vs Transaction Price Scatter Plot
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("search")

        mutex.acquire()

        # 从数据库中获取数据
        data = Property.search(keyword).with_entities(
            Property.built_area, Property.transaction_price).all()

        # 将数据存储到 pandas dataframe 中
        data_frame = pd.DataFrame(data)  # [row.__dict__ for row in data])

        # 如果数据为空，则返回错误信息
        if data_frame.empty:
            return {"success": False,
                    "message": "No data found."}, 400

        # 转换数据类型
        data_frame['transaction_price'] = data_frame['transaction_price'].astype(
            float)
        data_frame['built_area'] = data_frame['built_area'].astype(float)

        # 使用 pandas 和 matplotlib 生成图像
        plt.figure(figsize=(8, 6))

        plt.scatter(data_frame['built_area'],
                    data_frame['transaction_price'], alpha=0.5)

        plt.title('Built Area vs Transaction Price')
        plt.xlabel('Built Area')
        plt.ylabel('Transaction Price')

        # 将生成的图像存储到 bytesIO 中，便于在网络上发送
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='svg')
        img_bytes.seek(0)

        # 关闭图像，防止内存泄漏
        plt.close()

        # 返回图片内容
        # return Response(img_bytes, mimetype="image/svg+xml")

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img_bytes.getvalue())

        # 判断图片格式
        img_type = "svg+xml"

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        mutex.release()

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The image was successfully returned."}, 200


# 销售周期分布
@rest_api.route('/api/property/visualization/transaction_cycle_distribution')
class GetTransactionCycleImg(Resource):
    """
       Get Transaction Cycle Img
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("search")

        mutex.acquire()

        # 从数据库中获取数据
        data = Property.search(keyword).with_entities(
            Property.transaction_cycle).all()

        # 将数据存储到 pandas dataframe 中
        data_frame = pd.DataFrame(data)  # [row.__dict__ for row in data])

        # 如果数据为空，则返回错误信息
        if data_frame.empty:
            return {"success": False,
                    "message": "No data found."}, 400

        # 转换数据类型，如果无数据，则删除该行
        for index, row in data_frame.iterrows():
            if not row['transaction_cycle']:
                data_frame.drop(index, inplace=True)

        # 使用 pandas 和 matplotlib 生成图像
        plt.figure(figsize=(8, 6))

        data_frame['transaction_cycle'].plot(
            kind='hist', bins=100, color='blue', edgecolor='black', alpha=0.5)

        plt.title('Transaction Cycle Distribution')
        plt.xlabel('Transaction Cycle (Days)')
        plt.ylabel('Frequency')

        # 将生成的图像存储到 bytesIO 中，便于在网络上发送
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='svg')
        img_bytes.seek(0)

        # 关闭图像，防止内存泄漏
        plt.close()

        # 返回图片内容
        # return Response(img_bytes, mimetype="image/svg+xml")

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img_bytes.getvalue())

        # 判断图片格式
        img_type = "svg+xml"

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        mutex.release()

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The image was successfully returned."}, 200

# 历史房源饼图，room_layout格式: 1室1厅1厨1卫


@rest_api.route('/api/property/visualization/room_layout_distribution')
class GetRoomLayoutImg(Resource):
    """
    Get Room Layout Img
    """

    @token_required
    def get(self, current_user):

        # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("search")

        mutex.acquire()

        # 从数据库中获取数据
        data = Property.search(keyword).with_entities(
            Property.room_layout).all()

        # 将数据存储到 pandas dataframe 中
        data_frame = pd.DataFrame(data, columns=['room_layout'])

        # 如果数据为空，则返回错误信息
        if data_frame.empty:
            return {"success": False,
                    "message": "No data found."}, 400

        # 计算每个房源布局的数量
        layout_counts = data_frame['room_layout'].value_counts()

        # 计算每个房源布局的百分比
        layout_percentages = layout_counts / layout_counts.sum()

        # 筛选出占比大于或等于1%的数据
        main_layouts = layout_percentages[layout_percentages >= 0.01].index

        # 将剩余的数据合并为一个"其他"类别
        data_frame.loc[~data_frame['room_layout'].isin(
            main_layouts), 'room_layout'] = '其他'

        # 使用 pandas 和 matplotlib 生成图像
        plt.figure(figsize=(12, 8))

        # 绘制饼图
        data_frame['room_layout'].value_counts().plot(
            kind='pie', autopct='%1.1f%%', startangle=180, shadow=False, legend=False, fontsize=12, pctdistance=0.8, labeldistance=1.1)

        plt.title('Room Layout Distribution', pad=35, fontsize=20)
        plt.ylabel('')
        plt.axis('equal')

        # 将生成的图像存储到 bytesIO 中，便于在网络上发送
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='svg')
        img_bytes.seek(0)

        # 关闭图像，防止内存泄漏
        plt.close()

        # 返回图片内容
        # return Response(img_bytes, mimetype="image/svg+xml")

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img_bytes.getvalue())

        # 判断图片格式
        img_type = "svg+xml"

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        mutex.release()

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The image was successfully returned."}, 200


@rest_api.route('/api/property/visualization/average_price_by_month')
class GetAveragePriceByMonth(Resource):
    """
       Get Average Price by Month
    """

    @token_required
    def get(self, current_user):

         # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("search")

        mutex.acquire()

        # 从数据库中获取数据
        data = Property.search(keyword).with_entities(Property.transaction_time, Property.transaction_price).all()

        # 将数据存储到 pandas dataframe 中
        data_frame = pd.DataFrame(data, columns=['transaction_time', 'transaction_price'])

        # 将 transaction_time 转换为日期并设置为索引
        data_frame['transaction_time'] = pd.to_datetime(data_frame['transaction_time'])
        data_frame.set_index('transaction_time', inplace=True)

        # 计算每个月的平均价格，替换 transaction_price 列
        data_frame = data_frame.resample('M').mean()
        data_frame.rename(columns={'transaction_price': 'average_price'}, inplace=True)

        # 如果数据为空，则返回错误信息
        if data_frame.empty:
            return {"success": False,
                    "message": "No data found."}, 400

        # 使用 pandas 和 matplotlib 生成图像
        plt.figure(figsize=(12, 8))

        data_frame['average_price'].plot(kind='line', marker='o', color='red', alpha=0.5)

        plt.title('Average Price by Month')
        plt.xlabel('Transaction Time')
        plt.ylabel('Average Price')

        # 将生成的图像存储到 bytesIO 中，便于在网络上发送
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='svg')
        img_bytes.seek(0)

        # 关闭图像，防止内存泄漏
        plt.close()

        # 返回图片内容
        # return Response(img_bytes, mimetype="image/png")

        # 将图片转换为 base64
        img_base64 = base64.b64encode(img_bytes.getvalue())

        # 判断图片格式
        img_type = "svg+xml"

        # 将 base64 转换为字符串
        img_str = img_base64.decode()

        full_img_str = "data:image/{};base64,{}".format(img_type, img_str)

        mutex.release()

        return {"success": True,
                "type": img_type,
                "image": full_img_str,
                "message": "The image was successfully returned."}, 200

@rest_api.route('/api/property/analysis')
class PropertyAnalysis(Resource):
    """
       Property Analysis
    """

    @token_required
    def get(self, current_user):
        # get args
        req_data = request.args

        # get keyword
        keyword = req_data.get("keyword")

        if not keyword:
            return {"success": True,
                    "analysis": {
                        "Keyword required": "## Keyword is required. If you get all properties, the rendering time will be very long."
                    },
                    "message": "Keyword is required."}, 400

        # get all matching properties
        properties = Property.search(keyword)

        # analyzing and generating report
        report_dict = generate_analysis_report(properties)

        # print(report)

        # return response
        return {"success": True,
                "analysis": report_dict,
                "message": "Generated analysis report for {} properties.".format(properties.count())}, 200