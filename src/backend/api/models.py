# -*- encoding: utf-8 -*-

from datetime import datetime
import io
from sqlalchemy import or_

from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

"""
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` TEXT NOT NULL,
  `last_online` DATETIME,
  `created_at` DATETIME,
  `account_type` VARCHAR(50),
  `account_status` VARCHAR(50),
  `jwt_auth_active` BOOLEAN,
  PRIMARY KEY (`user_id`)
);
"""


def utc2local(utc_dtm):
    # UTC 时间转本地时间（ +8:00 ）
    local_tm = datetime.fromtimestamp(0)
    utc_tm = datetime.utcfromtimestamp(0)
    offset = local_tm - utc_tm
    return utc_dtm + offset


def local2utc(local_dtm):
    # 本地时间转 UTC 时间（ -8:00 ）
    return datetime.utcfromtimestamp(local_dtm.timestamp())


class User(db.Model):

    __tablename__ = 'user'
    user_id = db.Column(db.Integer(), primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.Text(), nullable=False)
    last_online = db.Column(db.DateTime())
    created_at = db.Column(db.DateTime(), default=datetime.utcnow)
    account_type = db.Column(db.String(50))
    account_status = db.Column(db.String(50))
    jwt_auth_active = db.Column(db.Boolean())

    def __repr__(self):
        return f"User {self.username}"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def set_username(self, username):
        self.username = username

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def set_username(self, new_username):
        self.username = new_username

    def check_jwt_auth_active(self):
        return self.jwt_auth_active

    def set_jwt_auth_active(self, set_status):
        self.jwt_auth_active = set_status

    def set_last_online(self):
        self.last_online = datetime.utcnow()

    def check_account_type(self):
        return self.account_type

    def set_account_type(self, account_type):
        self.account_type = account_type

    def check_account_status(self):
        return self.account_status

    def set_account_status(self, account_status):
        self.account_status = account_status

    @classmethod
    def get_all_users(cls):
        return cls.query.all()

    @classmethod
    def get_all_users_count(cls):
        return cls.query.count()

    @classmethod
    def get_part_users(cls, page, per_page):
        return cls.query.paginate(page, per_page, error_out=False)

    @classmethod
    def delete_user(cls):

        # print('delete user: ', cls.user_id)

        # print('delete announcement')
        announcements = cls.get_by_user_id(cls.user_id)
        for announcement in announcements:
            announcement.delete_announcement()
        # print('delete announcement done')

        db.session.delete(cls)
        db.session.commit()
        # print('delete user done')

    @classmethod
    def get_by_user_id(cls, user_id):
        return cls.query.get_or_404(user_id)

    @classmethod
    def get_by_username(cls, username):
        return cls.query.filter_by(username=username).first()

    def toDICT(self):

        cls_dict = {}
        cls_dict['user_id'] = self.user_id
        cls_dict['username'] = self.username
        # `last_online`` and `created_at` is a datetime object, so we need to convert it to string
        # if `last_online`` and `created_at` was None, we need to convert it to string too
        if self.last_online is None:
            cls_dict['last_online'] = ''
        else:
            # convert utc time to local time
            last_online_local = utc2local(self.last_online)
            cls_dict['last_online'] = last_online_local.strftime(
                '%Y-%m-%d %H:%M:%S')
        if self.created_at is None:
            cls_dict['created_at'] = ''
        else:
            # convert utc time to local time
            created_at_local = utc2local(self.created_at)
            cls_dict['created_at'] = created_at_local.strftime(
                '%Y-%m-%d %H:%M:%S')
        cls_dict['account_type'] = self.account_type
        cls_dict['account_status'] = self.account_status
        cls_dict['jwt_auth_active'] = self.jwt_auth_active

        return cls_dict

    def toJSON(self):

        return self.toDICT()


"""
CREATE TABLE IF NOT EXISTS `jwt_token_blocklist` (
	`id`	INTEGER NOT NULL AUTO_INCREMENT,
	`jwt_token`	TEXT NOT NULL,
	`created_at`	DATETIME NOT NULL,
	PRIMARY KEY(`id`)
);
"""


class JWTTokenBlocklist(db.Model):

    __tablename__ = 'jwt_token_blocklist'
    id = db.Column(db.Integer(), primary_key=True)
    jwt_token = db.Column(db.Text(), nullable=False)
    created_at = db.Column(db.DateTime(), nullable=False)

    def __repr__(self):
        return f"Expired Token: {self.jwt_token}"

    def save(self):
        db.session.add(self)
        db.session.commit()


"""
CREATE TABLE IF NOT EXISTS `announcement` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME,
  `modified_at` DATETIME,
  PRIMARY KEY (`id`, `user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`)
);
"""


class Announcement(db.Model):

    __tablename__ = 'announcement'
    id = db.Column(db.Integer(), primary_key=True,
                   autoincrement=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey(
        'user.user_id'))
    title = db.Column(db.String(128))
    content = db.Column(db.Text())
    created_at = db.Column(db.DateTime(), default=datetime.utcnow)
    modified_at = db.Column(db.DateTime())

    def __repr__(self):
        return f"Announcement {self.id}"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def new_announcement(self, user_id, title, content):
        self.user_id = user_id
        self.title = title
        self.content = content
        self.created_at = datetime.utcnow()

    def edit_announcement(self, title, content):
        self.title = title
        self.content = content
        self.modified_at = datetime.utcnow()

    @classmethod
    def get_content(cls):
        return cls.query.filter_by(id=cls.id).first()

    def set_title(self, title):
        self.title = title

    def set_content(self, content):
        self.content = content

    @classmethod
    def get_all_announcements(cls):
        return cls.query.all()

    @classmethod
    def get_total_announcements(cls):
        return cls.query.count()

    @classmethod
    def get_part_announcements(cls, page, per_page):
        return cls.query.paginate(page, per_page, error_out=False)

    @classmethod
    def delete_announcement(cls):
        db.session.delete(cls)
        db.session.commit()

    @classmethod
    def get_by_id(cls, id):
        return cls.query.get_or_404(id)

    @classmethod
    def get_by_user_id(cls, user_id):
        return cls.query.filter_by(user_id=user_id).all()

    def toDICT(self):

        cls_dict = {}
        cls_dict['id'] = self.id
        cls_dict['user_id'] = self.user_id
        cls_dict['title'] = self.title
        cls_dict['content'] = self.content
        # `created_at`` and `modified_at` is a datetime object, so we need to convert it to string
        # if `created_at`` and `modified_at` was None, we need to convert it to string too
        if self.created_at is None:
            cls_dict['created_at'] = ''
        else:
            # convert utc time to local time
            created_at_local = utc2local(self.created_at)
            cls_dict['created_at'] = created_at_local.strftime(
                '%Y-%m-%d %H:%M:%S')
        if self.modified_at is None:
            cls_dict['modified_at'] = ''
        else:
            # convert utc time to local time
            modified_at_local = utc2local(self.modified_at)
            cls_dict['modified_at'] = modified_at_local.strftime(
                '%Y-%m-%d %H:%M:%S')

        return cls_dict

    def toJSON(self):

        return self.toDICT()


"""
CREATE TABLE IF NOT EXISTS `Property` (
    `id`	INT NOT NULL AUTO INCREMENT,
	`city`	VARCHAR(255),
	`district`	VARCHAR(255),
	`street`	VARCHAR(255),
	`community_name`	VARCHAR(255),
	`transaction_price`	FLOAT,
	`unit_price`	INT,
	`transaction_time`	DATE,
	`transaction_cycle`	INT,
	`price_adjustment`	INT,
	`layout_diagram_link`	VARCHAR(255),
	`room_layout`	VARCHAR(255),
	`floor`	VARCHAR(255),
	`built_area`	FLOAT,
	`layout_structure`	VARCHAR(255),
	`internal_area`	FLOAT,
	`building_type`	VARCHAR(255),
	`orientation`	VARCHAR(255),
	`decoration`	VARCHAR(255),
	`building_structure`	VARCHAR(255),
	`elevator_ratio`	VARCHAR(255),
	`equipped_elevator`	VARCHAR(255),
	`listing_time`	DATE,
	`follows`	INT,
	`views`	INT,
	`transaction_ownership`	VARCHAR(255),
	`property_use`	VARCHAR(255),
	`property_age`	VARCHAR(255),
	`property_ownership`	VARCHAR(255),
	`developer`	VARCHAR(255),
	`property_management_company`	VARCHAR(255),
	`property_fees`	VARCHAR(255),
	`plot_ratio`	FLOAT,
	`total_building`	INT,
	`total_units`	INT,
	`fixed_parking_spaces`	FLOAT,
	`community_average_price`	FLOAT,
	`community_on_sale`	FLOAT,
	`community_on_rent`	VARCHAR(255),
	`property_link`	VARCHAR(255),
	`address`	VARCHAR(255),
	`longitude`	FLOAT,
	`latitude`	FLOAT
);
"""


class Property(db.Model):

    __tablename__ = 'property'
    id = db.Column(db.Integer(), primary_key=True,
                   autoincrement=True, nullable=False)
    city = db.Column(db.String(255))
    district = db.Column(db.String(255))
    street = db.Column(db.String(255))
    community_name = db.Column(db.String(255))
    transaction_price = db.Column(db.Float())
    unit_price = db.Column(db.Integer())
    transaction_time = db.Column(db.Date())
    transaction_cycle = db.Column(db.Integer())
    price_adjustment = db.Column(db.Integer())
    layout_diagram_link = db.Column(db.String(255))
    room_layout = db.Column(db.String(255))
    floor = db.Column(db.String(255))
    built_area = db.Column(db.Float())
    layout_structure = db.Column(db.String(255))
    internal_area = db.Column(db.Float())
    building_type = db.Column(db.String(255))
    orientation = db.Column(db.String(255))
    decoration = db.Column(db.String(255))
    building_structure = db.Column(db.String(255))
    elevator_ratio = db.Column(db.String(255))
    equipped_elevator = db.Column(db.String(255))
    listing_time = db.Column(db.Date())
    follows = db.Column(db.Integer())
    views = db.Column(db.Integer())
    transaction_ownership = db.Column(db.String(255))
    property_use = db.Column(db.String(255))
    property_age = db.Column(db.String(255))
    property_ownership = db.Column(db.String(255))
    developer = db.Column(db.String(255))
    property_management_company = db.Column(db.String(255))
    property_fees = db.Column(db.String(255))
    plot_ratio = db.Column(db.Float())
    total_building = db.Column(db.Integer())
    total_units = db.Column(db.Integer())
    fixed_parking_spaces = db.Column(db.Float())
    community_average_price = db.Column(db.Float())
    community_on_sale = db.Column(db.Float())
    community_on_rent = db.Column(db.String(255))
    property_link = db.Column(db.String(255))
    address = db.Column(db.String(255))
    longitude = db.Column(db.Float())
    latitude = db.Column(db.Float())

    def __repr__(self):
        return f"Property {self.id}"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def recv_sql_statement(self, sql_statement):
        db.session.execute(sql_statement)
        db.session.commit()

    @classmethod
    def get_all(cls):
        return cls.query.all(), cls.query.count()

    @classmethod
    def get_all_count(cls):
        return cls.query.count()

    @classmethod
    def get_by_id(cls, id):
        return cls.query.filter_by(id=id).first()

    # get by custom
    # usage: get_by_custom(city='上海', district='浦东')
    @classmethod
    def get_by_custom(cls, page, per_page, **kwargs):
        query = cls.query.filter_by(**kwargs)
        return query.paginate(page, per_page, False), query.count()

    @classmethod
    def get_part_properties(cls, page, per_page):
        # return cls.query.slice(start, end).all()
        query = cls.query
        return cls.query.paginate(page, per_page, False), query.count()
    
    # 模糊搜索分页，调用不分页的方法
    @classmethod
    def search_paginated(cls, page, per_page, keyword):
        return cls.search(keyword).paginate(page, per_page, False), cls.search(keyword).count()
        
    # 模糊搜索不分页
    @classmethod
    def search(cls, keyword):
        if keyword:
            # %20 代表空格，拆分关键字搜索
            keywords = keyword.split(' ')
            query = cls.query
            for key in keywords:
                query = query.filter(or_(cls.city.like('%' + key + '%'),
                                         cls.district.like('%' + key + '%'),
                                         cls.street.like('%' + key + '%'),
                                         cls.community_name.like('%' + key + '%'),
                                         cls.room_layout.like('%' + key + '%'),
                                         cls.floor.like('%' + key + '%'),
                                         cls.layout_structure.like('%' + key + '%'),
                                         cls.building_type.like('%' + key + '%'),
                                         cls.orientation.like('%' + key + '%'),
                                         cls.decoration.like('%' + key + '%'),
                                         cls.building_structure.like('%' + key + '%'),
                                         cls.elevator_ratio.like('%' + key + '%'),
                                         cls.equipped_elevator.like('%' + key + '%'),
                                         cls.property_use.like('%' + key + '%'),
                                         cls.property_age.like('%' + key + '%'),
                                         cls.property_ownership.like('%' + key + '%'),
                                         cls.developer.like('%' + key + '%'),
                                         cls.property_management_company.like('%' + key + '%'),
                                         cls.property_fees.like('%' + key + '%'),
                                         cls.community_on_rent.like('%' + key + '%'),
                                         cls.property_link.like('%' + key + '%'),
                                         cls.address.like('%' + key + '%')
                                         ))
            return query
        else:
            query = cls.query
            return query

    def toDICT(self):
        cls_dict = {}
        cls_dict['id'] = self.id
        cls_dict['city'] = self.city
        cls_dict['district'] = self.district
        cls_dict['street'] = self.street
        cls_dict['community_name'] = self.community_name
        cls_dict['transaction_price'] = self.transaction_price
        cls_dict['unit_price'] = self.unit_price
        cls_dict['transaction_time'] = self.transaction_time.strftime(
            '%Y-%m-%d')
        cls_dict['transaction_cycle'] = self.transaction_cycle
        cls_dict['price_adjustment'] = self.price_adjustment
        cls_dict['layout_diagram_link'] = self.layout_diagram_link
        cls_dict['room_layout'] = self.room_layout
        cls_dict['floor'] = self.floor
        cls_dict['built_area'] = self.built_area
        cls_dict['layout_structure'] = self.layout_structure
        cls_dict['internal_area'] = self.internal_area
        cls_dict['building_type'] = self.building_type
        cls_dict['orientation'] = self.orientation
        cls_dict['decoration'] = self.decoration
        cls_dict['building_structure'] = self.building_structure
        cls_dict['elevator_ratio'] = self.elevator_ratio
        cls_dict['equipped_elevator'] = self.equipped_elevator
        cls_dict['listing_time'] = self.listing_time.strftime('%Y-%m-%d')
        cls_dict['follows'] = self.follows
        cls_dict['views'] = self.views
        cls_dict['transaction_ownership'] = self.transaction_ownership
        cls_dict['property_use'] = self.property_use
        cls_dict['property_age'] = self.property_age
        cls_dict['property_ownership'] = self.property_ownership
        cls_dict['developer'] = self.developer
        cls_dict['property_management_company'] = self.property_management_company
        cls_dict['property_fees'] = self.property_fees
        cls_dict['plot_ratio'] = self.plot_ratio
        cls_dict['total_building'] = self.total_building
        cls_dict['total_units'] = self.total_units
        cls_dict['fixed_parking_spaces'] = self.fixed_parking_spaces
        cls_dict['community_average_price'] = self.community_average_price
        cls_dict['community_on_sale'] = self.community_on_sale
        cls_dict['community_on_rent'] = self.community_on_rent
        cls_dict['property_link'] = self.property_link
        cls_dict['address'] = self.address
        cls_dict['longitude'] = self.longitude
        cls_dict['latitude'] = self.latitude
        return cls_dict

    def toJSON(self):
        return self.toDICT()
