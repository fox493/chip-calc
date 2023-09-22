'use client';
import type { InputRef } from 'antd';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Table,
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import React, { useContext, useEffect, useRef, useState } from 'react';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: React.Key;
  name: string;
  buyInTimes: number;
  balance: number;
  win: number;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof Item;
  record: Item;
  buyIn: number;
  chipPrice: number;
  fee: number;
  handleSave: (record: Item) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  buyIn,
  chipPrice,
  fee,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  name: string;
  buyInTimes: number;
  balance: number;
  win: number;
  fee: number;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const App: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>([]);

  const [count, setCount] = useState(1);

  const [buyIn, setBuyIn] = useState(200);
  const [chipPrice, setchipPrice] = useState(1);
  const [fee, setFee] = useState(1000);

  const [totalPL, setTotalPL] = useState(0);
  const [totalP, setTotalP] = useState(0);

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter(item => item.key !== key);
    setDataSource(newData);
  };

  const defaultColumns: (ColumnTypes[number] & {
    editable?: boolean;
    dataIndex: string;
  })[] = [
    {
      title: 'No.',
      dataIndex: 'key',
      width: '10%',
      editable: false,
    },
    {
      title: '玩家',
      dataIndex: 'name',
      width: '30%',
      editable: true,
    },
    {
      title: '买入',
      dataIndex: 'buyInTimes',
      editable: true,
    },
    {
      title: '筹码数量',
      dataIndex: 'balance',
      editable: true,
    },
    {
      title: '盈利',
      dataIndex: 'win',
      render: (_, record) => {
        return record.win > 0 ? (
          <span style={{ color: 'green' }}>{record.win}</span>
        ) : (
          <span style={{ color: 'red' }}>{record.win}</span>
        );
      },
    },
    {
      title: '支付台费',
      dataIndex: 'fee',
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDelete(record.key)}
          >
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const handleAdd = () => {
    const newData: DataType = {
      key: count,
      name: '玩家' + count,
      buyInTimes: 0,
      balance: 0,
      win: 0,
      fee: 0,
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
  };

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
        buyIn,
        chipPrice,
        fee,
      }),
    };
  });

  return (
    <div>
      <Space direction="vertical" style={{ marginBottom: 20 }}>
        <Button onClick={handleAdd} type="primary">
          添加玩家
        </Button>
        <Row>
          <Space>
            <div>买入</div>
            <InputNumber
              defaultValue={200}
              onBlur={e => {
                const buyin = e.target.value.split('¥')[1];
                setBuyIn(Number(buyin));
              }}
              formatter={value =>
                `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            />
          </Space>
        </Row>
        <Row>
          <Space>
            <div>筹码价格</div>
            <InputNumber
              defaultValue={1}
              onBlur={e => {
                const ratio = e.target.value.split('¥')[1];
                setchipPrice(Number(ratio));
              }}
              formatter={value =>
                `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            />
          </Space>
        </Row>
        <Row>
          <Space>
            <div>台费</div>
            <InputNumber
              defaultValue={1000}
              onBlur={e => {
                const fee = e.target.value.split('¥')[1];
                setFee(Number(fee));
              }}
              formatter={value =>
                `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            />
          </Space>
        </Row>
        <Row>
          <Button
            type="primary"
            onClick={() => {
              let sum = 0;
              let totalWin = 0;
              for (const item of dataSource) {
                item.win = item.balance * chipPrice - buyIn * item.buyInTimes;
                sum += item.win;
                if (item.win < 0) {
                  item.fee = 0;
                } else {
                  totalWin += item.win;
                }
              }
              for (const item of dataSource) {
                if (item.win > 0) {
                  item.fee = Math.round((item.win / totalWin) * fee);
                }
              }
              setTotalPL(sum);
              setTotalP(totalWin);
            }}
          >
            计算
          </Button>
        </Row>
      </Space>
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={dataSource}
        columns={columns as ColumnTypes}
      />
      <Space direction="vertical">
        <div
          style={{
            color: totalPL > 0 ? 'green' : 'red',
          }}
        >
          总盈亏：{totalPL}
        </div>
        <div
          style={{
            color: 'green',
          }}
        >
          总盈利：{totalP}
        </div>
      </Space>
    </div>
  );
};

export default App;
