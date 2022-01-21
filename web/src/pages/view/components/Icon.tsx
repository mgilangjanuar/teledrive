import {
  AudioOutlined, FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FolderOpenOutlined, VideoCameraOutlined
} from '@ant-design/icons'
import React from 'react'

const Icon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'image') {
    return <FileImageOutlined />
  } else if (type === 'video') {
    return <VideoCameraOutlined />
  } else if (type === 'document') {
    return <FilePdfOutlined />
  } else if (type === 'folder') {
    return <FolderOpenOutlined />
  } else if (type === 'audio') {
    return <AudioOutlined />
  } else {
    return <FileOutlined />
  }
}

export default Icon