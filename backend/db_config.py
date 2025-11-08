import oracledb

def get_oracle_conn():
    # Navicat配置：host=localhost, port=1521, service_name=FREE, username=system, password=111111
    dsn = oracledb.makedsn('localhost', 1521, service_name='FREE')
    conn = oracledb.connect(user='system', password='111111', dsn=dsn)
    return conn 