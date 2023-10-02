import TarObject, { TarObjectHeader } from './TarObject';
import extract from './extract';

export {
  TAR_OBJECT_TYPE_BLOCK_SPECIAL,
  TAR_OBJECT_TYPE_CHAR_SPECIAL,
  TAR_OBJECT_TYPE_CONTIGUOUS,
  TAR_OBJECT_TYPE_DIRECTORY,
  TAR_OBJECT_TYPE_FIFO,
  TAR_OBJECT_TYPE_FILE,
  TAR_OBJECT_TYPE_GNU_NEXT_LINK_NAME,
  TAR_OBJECT_TYPE_GNU_NEXT_NAME,
  TAR_OBJECT_TYPE_HARD_LINK,
  TAR_OBJECT_TYPE_PAX_GLOBAL,
  TAR_OBJECT_TYPE_PAX_NEXT,
  TAR_OBJECT_TYPE_SYM_LINK,
} from './TarObject';

export type {
  TarObject,
  TarObjectHeader,
};

export {
  extract,
};
