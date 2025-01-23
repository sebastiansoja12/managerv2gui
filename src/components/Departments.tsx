import React, {useEffect, useState} from 'react';
import Department from "../class/depots/Department";
import departmentService from "../hooks/DepartmentService";

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Array<Department>>([]);

    useEffect(() => {
        retrieveDepartments();
    }, []);

    const retrieveDepartments = () => {
        departmentService.getAll()
            .then((response: any) => {
                setDepartments(response.data);
                console.log(response.data)
            })
            .catch((e: Error) => {
                console.log(e);
            });
    };

    return (
        <div className="overflow-x-auto">
            <table>
                <thead>
                <tr>
                    <th>Department code</th>
                    <th>City</th>
                    <th>Street</th>
                    <th>Country</th>
                    <th>Postal Code</th>
                    <th>NIP</th>
                    <th>Telephone Number</th>
                    <th>Opening Hours</th>
                </tr>
                </thead>
                <tbody>
                {departments?.map((department) => (
                    <tr key={department.departmentCode.value}>
                        <td>{department.departmentCode.value}</td>
                        <td>{department.city}</td>
                        <td>{department.street}</td>
                        <td>{department.country}</td>
                        <td>{department.postalCode}</td>
                        <td>{department.nip}</td>
                        <td>{department.telephoneNumber}</td>
                        <td>{department.openingHours}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

};

export default Departments;