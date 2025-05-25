export const defaultTags = [
    'Phòng khách',
    'Phòng ngủ',
    'Phòng bếp',
    'Phòng tắm',
    'Trang trí',
    'Đèn',
    'Ngoại thất',
    'Phụ kiện',
    'Tủ/kệ',
    'Bàn ghế',
  ];

  export const addTag = (tags, newTag) =>{

    if( newTag && !tags.includes(newTag)){
        return[...tags,newTag]
    }
    return tags;

  }
  export const removeTag = (tags , tagToRemove) =>{
    return tags.filter(tag => tag !=tagToRemove)
  }