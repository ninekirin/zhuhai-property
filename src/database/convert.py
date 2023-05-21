# Author: Kirin
# Date: 2023-05-12
# Brief: Convert CSV to SQL

import pandas as pd
from datetime import datetime

"""
name_zh: 城市,区县,街道,小区名字,成交价,单价,成交时间,成交周期,调价,户型图,房屋户型,所在楼层,建筑面积,户型结构,套内面积,建筑类型,房屋朝向,装修情况,建筑结构,梯户比例,配备电梯,挂牌时间,关注,浏览,交易权属,房屋用途,房屋年限,房权所属,开发企业,物业公司,物业费用,容积率,总楼栋,总户数,固定车位数,小区均价,小区在售,小区在租,房源链接,地址,经度,纬度
name_en: city,district,street,community_name,transaction_price,unit_price,transaction_time,transaction_cycle,price_adjustment,layout_diagram_link,room_layout,floor,built_area,layout_structure,internal_area,building_type,orientation,decoration,building_structure,elevator_ratio,equipped_elevator,listing_time,follows,views, transaction_ownership,property_use,property_age,property_ownership,developer,property_management_company,property_fees,plot_ratio,total_building,total_units,fixed_parking_spaces,community_average_price,community_on_sale,community_on_rent,property_link,address,longitude,latitude

name_en_1: city,area,street,community,price,unit_price,deal_time,deal_cycle,adjustment,house_type_img,house_type,floor_area,house_structure,inner_area,building_type,orientation,decoration,building_structure,elevator_ratio,elevator,listing_time,follow,browse,transaction_ownership,house_use,house_age,house_ownership,developer,property_company,property_fee,plot_ratio,total_buildings,total_houses,fixed_parking_space,community_average_price,community_on_sale,community_on_rent,house_link,address,longitude,latitude
name_en_2: city,district,street,community_name,transaction_price,unit_price,transaction_time,transaction_cycle,price_adjustment,layout_diagram,room_layout,floor,built_area,layout_structure,internal_area,building_type,orientation,decoration,building_structure,elevator_ratio,equipped_elevator,listing_time,attention,views, transaction_ownership,property_use,property_age,property_ownership,developer,property_management_company,property_fees,plot_ratio,total_building,total_units,fixed_parking_spaces,community_average_price,community_on_sale,community_on_rent,property_link,address,longitude,latitude
file_name: 珠海历史成交.csv
output: 珠海历史成交.sql
"""

name_zh = "城市,区县,街道,小区名字,成交价,单价,成交时间,成交周期,调价,户型图,房屋户型,所在楼层,建筑面积,户型结构,套内面积,建筑类型,房屋朝向,装修情况,建筑结构,梯户比例,配备电梯,挂牌时间,关注,浏览,交易权属,房屋用途,房屋年限,房权所属,开发企业,物业公司,物业费用,容积率,总楼栋,总户数,固定车位数,小区均价,小区在售,小区在租,房源链接,地址,经度,纬度"

file_name = "property_en.csv"

output = "property.sql"

def convert_csv_to_sql(file_name):
    # 读取CSV文件
    data = pd.read_csv(file_name)

    # 添加首列id
    data.insert(0, 'id', range(1, len(data)+1))

    # 提取列名
    column_names = data.columns

    # 创建SQL语句
    sql = f"CREATE TABLE IF NOT EXISTS {output.strip('.sql')} ("

    # 添加列名和数据类型到SQL语句
    for i, col_name in enumerate(column_names):
        print(data[col_name])
        # 成交时间的格式不太对，需要格式化
        if data[col_name].name == 'transaction_time': # '成交时间':
            col_type = 'DATE'
            # format 2021.08.11 to 2021-08-11
            data[col_name] = data[col_name].apply(lambda x: datetime.strptime(x, '%Y.%m.%d').strftime('%Y-%m-%d'))
        elif data[col_name].name == 'listing_time': # '挂牌时间':
            col_type = 'DATE'
            # format 2021/08/11 to 2021-08-11
            data[col_name] = data[col_name].apply(lambda x: datetime.strptime(x, '%Y/%m/%d').strftime('%Y-%m-%d'))
        elif data[col_name].name == 'transaction_price': # '成交价':
            col_type = 'FLOAT'
        elif data[col_name].name == 'id':
            col_type = 'INT PRIMARY KEY'
        elif data[col_name].name == 'unit_price' or data[col_name].name == 'transaction_cycle': # '单价' or data[col_name].name == '成交周期':
            col_type = 'INT'
        elif data[col_name].dtypes == 'object':
            col_type = 'VARCHAR(255)'
        elif data[col_name].dtypes == 'int64':
            col_type = 'INT'
        elif data[col_name].dtypes == 'float64':
            col_type = 'FLOAT'
        elif data[col_name].dtypes == 'datetime64[ns]':
            col_type = 'DATETIME'
        elif data[col_name].dtypes == 'bool':
            col_type = 'TINYINT'
        else:
            col_type = 'TEXT'

        # 添加列及其数据类型到SQL语句中
        sql += f"{col_name} {col_type}"
        if i + 1 < len(column_names):
            sql += ", "
        else:
            sql += ");"

    # 添加INSERT INTO语句
    for _, row in data.iterrows():
        sql += f"INSERT INTO {output.strip('.sql')} ("
        sql += ", ".join(column_names) + ") VALUES ("
        for i, value in enumerate(row.values):
            # 根据数据类型格式化值，字符串和日期需要加引号
            if isinstance(value, str):
                value = f"'{value}'"
            elif pd.isnull(value):
                value = "NULL"
            else:
                value = str(value)

            sql += value
            if i + 1 < len(row.values):
                sql += ", "
            else:
                sql += ");"

    # 返回生成的SQL文件
    with open(output, 'w', encoding='utf-8') as f:
        f.write(sql)

# 调用函数，生成SQL文件
convert_csv_to_sql(file_name)