# -*- encoding: utf-8 -*-

import statistics as stats
import numpy as np
import markdown2 as md

def generate_analysis_report(properties):
    report = ""
    report_dict = {}

    # determine unique communities
    communities = {property.community_name: [] for property in properties}

    # group properties by community
    for property in properties:
        communities[property.community_name].append(property)

    # generate community report
    for community, properties in communities.items():
        report_tmp = generate_community_report(community, properties)
        report += report_tmp
        report_dict[community] = report_tmp

    # convert report to markdown format
    # report = md.markdown(report)

    return report_dict

def generate_community_report(community_name, properties):
    # Community Basic Information
    # report = "## **{}**\n\n".format(community_name)
    report = "## Community Basic Information\n\n"

    address = properties[0].address
    longitude = properties[0].longitude
    latitude = properties[0].latitude
    
    report += "**Address**: {}\n\n".format(address)
    report += "**Longitude**: {}\n\n".format(longitude)
    report += "**Latitude**: {}\n\n".format(latitude)

    # Community Price Analysis
    report += "## Community Price Analysis\n\n"

    transaction_prices = [property.transaction_price for property in properties]
    unit_prices = [property.unit_price for property in properties]

    min_trans_price = min(transaction_prices, default=0)
    max_trans_price = max(transaction_prices, default=0)
    median_trans_price = stats.median(transaction_prices) if transaction_prices else 0

    min_unit_price = min(unit_prices, default=0)
    max_unit_price = max(unit_prices, default=0)
    median_unit_price = stats.median(unit_prices) if unit_prices else 0

    report += '### Transaction Prices\n\n'
    report += '- Minimum: {} | Maximum: {} | Median: {}\n\n'.format(min_trans_price, max_trans_price, median_trans_price)
    report += '### Unit Prices\n\n'
    report += '- Minimum: {} | Maximum: {} | Median: {}\n\n'.format(min_unit_price, max_unit_price, median_unit_price)

    # Community Property Analysis
    report += "## Community Property Analysis\n\n"

    layout_counts = np.unique([property.room_layout for property in properties], return_counts=True)
    floor_counts = np.unique([property.floor for property in properties], return_counts=True)

    report += '### Room Layout Distribution\n'
    for layout, count in zip(*layout_counts):
        report += '- {}: {}\n'.format(layout, count)

    report += '\n### Floor Distribution\n'
    for floor, count in zip(*floor_counts):
        report += '- {}: {}\n'.format(floor, count)

    return report